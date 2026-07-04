"use client";

// components/questionnaire/Simulateur.tsx
// Orchestrateur du simulateur en DEUX PHASES (réduction de friction) :
//
//   intro → quick win (3 questions) → calcul court → écart estimé « SON chiffre »
//         → [Affiner] → affinage (5 questions) → calcul → résultats complets
//         └ ou [Voir le classement] → résultats complets directement
//
// Le même moteur pur (lib/engine) tourne sur un profil construit par
// answersToProfileLenient : 3 réponses réelles + défauts prudents, puis 8 réelles.
// État 100 % en mémoire React (useReducer), aucune persistance navigateur (RGPD).

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Link from "next/link";
import {
  QUESTIONS,
  QUICK_WIN_IDS,
  REFINE_IDS,
  answersToProfileLenient,
  answeredCount,
  quickWinAnsweredCount,
  isComplete,
  isIncomeDisclosed,
  selectedBand,
  type Answers,
  type QuestionId,
} from "@/lib/answers";
import { answersToAuditProfile, buildAuditResult } from "@/lib/audit";
import { computeCurrentSituationCost, rankCards } from "@/lib/engine";
import type { Card } from "@/lib/types";
import { Logo } from "@/components/brand/Logo";
import IntroScreen from "./IntroScreen";
import ProgressBar from "./ProgressBar";
import QuestionStep from "./QuestionStep";
import CalculatingScreen from "./CalculatingScreen";
import QuickResult from "@/components/results/QuickResult";
import ResultsPreview from "@/components/results/ResultsPreview";

interface SimulateurProps {
  cards: Card[];
}

/**
 * Ordre d'AFFICHAGE : d'abord les 3 questions du quick win, puis les 5 de
 * l'affinage. Source unique dérivée de lib/answers ; `answersToProfileLenient`
 * retrouve chaque réponse par son id, indépendamment de cet ordre.
 */
const DISPLAY_ORDER: QuestionId[] = [...QUICK_WIN_IDS, ...REFINE_IDS];
/** Nombre de questions du quick win (frontière quick / affinage). */
const QUICK_COUNT = QUICK_WIN_IDS.length;
const LAST_STEP = DISPLAY_ORDER.length - 1;
const TOTAL_QUESTIONS = DISPLAY_ORDER.length;

/** Index d'affichage de la question « part hors euro » (pour la correction P9). */
const FOREIGN_SHARE_STEP = DISPLAY_ORDER.indexOf("foreignShare");

type Phase = "intro" | "question" | "calculating" | "quickResult" | "results";
/** Destination après l'écran de calcul : chiffre express ou résultats complets. */
type CalcTarget = "quick" | "full";

interface State {
  phase: Phase;
  /** Index dans DISPLAY_ORDER (0..LAST_STEP). */
  step: number;
  answers: Answers;
  calcTarget: CalcTarget;
}

type Action =
  | { type: "start" }
  | { type: "setAnswer"; qid: QuestionId; optionId: string }
  | { type: "advance" }
  | { type: "back" }
  | { type: "goto"; step: number }
  | { type: "startRefine" }
  | { type: "seeAll" }
  | { type: "calcDone" }
  | { type: "edit" }
  | { type: "restart" };

/** Délai laissant voir la sélection confirmée avant de passer à l'écran suivant. */
const ADVANCE_DELAY_MS = 420;
/** Durée de l'écran de calcul avant les résultats complets (P8). */
const CALC_DELAY_MS = 2200;
/** Calcul express plus court : la preuve de valeur doit arriver vite (< 30 s). */
const QUICK_CALC_DELAY_MS = 1100;

/** Log d'un event de funnel, silencieux (le stockage est optionnel côté UX). */
function logFunnelEvent(
  eventType: "arrivee" | "start_quiz" | "quickwin" | "affiner" | "complete",
) {
  fetch("/api/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: null, eventType }),
    keepalive: true,
  }).catch(() => {});
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start":
      return { ...state, phase: "question", step: 0 };
    case "setAnswer":
      return {
        ...state,
        answers: { ...state.answers, [action.qid]: action.optionId },
      };
    case "advance":
      // Fin de l'affinage ⇒ calcul complet ; fin du quick win ⇒ calcul express.
      if (state.step >= LAST_STEP)
        return { ...state, phase: "calculating", calcTarget: "full" };
      if (state.step === QUICK_COUNT - 1)
        return { ...state, phase: "calculating", calcTarget: "quick" };
      return { ...state, step: state.step + 1 };
    case "back":
      // Première question ⇒ accroche ; première question d'affinage ⇒ chiffre express.
      if (state.step <= 0) return { ...state, phase: "intro", step: 0 };
      if (state.step === QUICK_COUNT) return { ...state, phase: "quickResult" };
      return { ...state, step: state.step - 1 };
    case "goto":
      return {
        ...state,
        phase: "question",
        step: Math.min(Math.max(action.step, 0), LAST_STEP),
      };
    case "startRefine":
      // Depuis le chiffre express : révéler les 5 questions restantes.
      return { ...state, phase: "question", step: QUICK_COUNT };
    case "seeAll":
      // Depuis le chiffre express : aller droit aux résultats (profil défauté).
      return { ...state, phase: "results" };
    case "calcDone":
      return {
        ...state,
        phase: state.calcTarget === "quick" ? "quickResult" : "results",
      };
    case "edit":
      // Depuis les résultats complets : revenir corriger la dernière question.
      return { ...state, phase: "question", step: LAST_STEP };
    case "restart":
      return { phase: "intro", step: 0, answers: {}, calcTarget: "quick" };
    default:
      return state;
  }
}

/**
 * Priorité 9 — garde-fou de cohérence LÉGER. Si l'utilisateur déclare voyager
 * souvent hors Europe (question d'affinage) mais quasiment aucune dépense en
 * devises (question express), on propose une micro-confirmation NON bloquante.
 */
function coherenceWarning(answers: Answers): string | null {
  const travel = selectedBand("travelFrequency", answers);
  const share = selectedBand("foreignShare", answers);
  const travelsOften = travel === "4_6_par_an" || travel === "plus_6_par_an";
  const almostNoForeign = share === "moins_5pct";
  if (travelsOften && almostNoForeign) {
    return "Vous voyagez souvent hors d'Europe mais indiquez presque aucune dépense en devises.";
  }
  return null;
}

export default function Simulateur({ cards }: SimulateurProps) {
  const [state, dispatch] = useReducer(reducer, {
    phase: "intro",
    step: 0,
    answers: {},
    calcTarget: "quick",
  });
  const [advancing, setAdvancing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  // P9 : message de cohérence en attente + mémoire d'acquittement (une fois suffit).
  const [coherenceMsg, setCoherenceMsg] = useState<string | null>(null);
  const coherenceAckd = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audited = useRef(false);
  const quickwinLogged = useRef(false);
  const completeLogged = useRef(false);

  const currentQid = DISPLAY_ORDER[state.step];
  const question = QUESTIONS.find((q) => q.id === currentQid);
  const inRefine = state.step >= QUICK_COUNT;
  const onResults = state.phase === "results";
  const incomeDisclosed = isIncomeDisclosed(state.answers);

  // Nettoyage du timer d'auto-avance au démontage.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // Funnel : « arrivée » une seule fois à l'ouverture de la page.
  const arrived = useRef(false);
  useEffect(() => {
    if (arrived.current) return;
    arrived.current = true;
    logFunnelEvent("arrivee");
  }, []);

  /** Lance la temporisation d'auto-avance vers l'écran suivant. */
  const scheduleAdvance = useCallback(() => {
    setAdvancing(true);
    timer.current = setTimeout(() => {
      dispatch({ type: "advance" });
      setAdvancing(false);
    }, ADVANCE_DELAY_MS);
  }, []);

  // Sélection : on enregistre (highlight visible), on vérifie la cohérence (P9),
  // puis on avance après un court délai — sauf si une confirmation est requise.
  const handleSelect = useCallback(
    (qid: QuestionId, optionId: string) => {
      if (advancing) return;
      dispatch({ type: "setAnswer", qid, optionId });

      const candidate: Answers = { ...state.answers, [qid]: optionId };
      const warn = coherenceWarning(candidate);
      if (warn && !coherenceAckd.current) {
        // Non bloquant : on affiche la micro-confirmation et on attend l'action.
        setCoherenceMsg(warn);
        return;
      }
      setCoherenceMsg(null);
      scheduleAdvance();
    },
    [advancing, state.answers, scheduleAdvance],
  );

  // P9 — « Oui, c'est exact » : on acquitte (ne plus redemander) et on avance.
  const confirmCoherence = useCallback(() => {
    coherenceAckd.current = true;
    setCoherenceMsg(null);
    scheduleAdvance();
  }, [scheduleAdvance]);

  // P9 — « Corriger » : retour à la question des dépenses en devises.
  const fixCoherence = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setAdvancing(false);
    setCoherenceMsg(null);
    dispatch({ type: "goto", step: FOREIGN_SHARE_STEP });
  }, []);

  const goBack = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setAdvancing(false);
    setCoherenceMsg(null);
    // Depuis le chiffre express : revenir à la dernière question du quick win.
    if (state.phase === "quickResult") {
      dispatch({ type: "goto", step: QUICK_COUNT - 1 });
      return;
    }
    dispatch({ type: "back" });
  }, [state.phase]);

  const startQuestionnaire = useCallback(() => {
    logFunnelEvent("start_quiz");
    dispatch({ type: "start" });
  }, []);

  const startRefine = useCallback(() => {
    logFunnelEvent("affiner");
    dispatch({ type: "startRefine" });
  }, []);

  const seeAllCards = useCallback(() => {
    dispatch({ type: "seeAll" });
  }, []);

  // Calcul dérivé (moteur pur) mémoïsé sur les réponses. Dès que les 3 questions
  // du quick win sont répondues, on peut chiffrer avec un profil « lenient »
  // (défauts prudents pour le reste). Le calcul se raffine automatiquement à
  // chaque réponse d'affinage. P5 : jamais de filtre d'éligibilité ici.
  const engine = useMemo(() => {
    if (quickWinAnsweredCount(state.answers) < QUICK_COUNT) return null;
    const profile = answersToProfileLenient(state.answers);
    return {
      current: computeCurrentSituationCost(profile),
      ranked: rankCards(cards, profile, { onlyEligible: false }),
    };
  }, [state.answers, cards]);

  // Écran de calcul (P8) : temporisation avant de révéler le résultat.
  useEffect(() => {
    if (state.phase !== "calculating") return;
    const delay = state.calcTarget === "quick" ? QUICK_CALC_DELAY_MS : CALC_DELAY_MS;
    const id = setTimeout(() => dispatch({ type: "calcDone" }), delay);
    return () => clearTimeout(id);
  }, [state.phase, state.calcTarget]);

  // Funnel : « quickwin » à l'affichage du chiffre express, une seule fois.
  useEffect(() => {
    if (state.phase !== "quickResult" || quickwinLogged.current) return;
    quickwinLogged.current = true;
    logFunnelEvent("quickwin");
  }, [state.phase]);

  // À l'arrivée sur les résultats complets : « complete » si les 8 questions
  // sont réellement renseignées (pas via le raccourci « Voir le classement »),
  // puis enregistrement de l'audit anonymisé (fourchettes + résultat), une seule
  // fois. Fire-and-forget : un échec réseau/DB ne casse jamais le parcours.
  useEffect(() => {
    if (!onResults || !engine) return;

    if (isComplete(state.answers) && !completeLogged.current) {
      completeLogged.current = true;
      logFunnelEvent("complete");
    }

    if (audited.current) return;
    audited.current = true;
    fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: answersToAuditProfile(state.answers),
        result: buildAuditResult(engine.current, engine.ranked),
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.sessionId) setSessionId(data.sessionId);
      })
      .catch(() => {
        /* silencieux : le stockage est optionnel côté UX */
      });
  }, [onResults, engine, state.answers]);

  const handleRestart = useCallback(() => {
    audited.current = false;
    coherenceAckd.current = false;
    quickwinLogged.current = false;
    completeLogged.current = false;
    setSessionId(null);
    setCoherenceMsg(null);
    dispatch({ type: "restart" });
  }, []);

  const handleEdit = useCallback(() => {
    audited.current = false;
    dispatch({ type: "edit" });
  }, []);

  const showBack = state.phase === "question" || state.phase === "quickResult";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
      {/* En-tête : retour à gauche (convention), marque au centre */}
      <div className="mb-6 grid grid-cols-3 items-center">
        <div className="justify-self-start">
          {showBack && (
            <button
              type="button"
              onClick={goBack}
              className="rounded-lg px-1 py-1 text-sm font-medium text-slate-500 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              ← Retour
            </button>
          )}
        </div>
        <Link href="/" aria-label="Accueil CB180" className="justify-self-center">
          <Logo size={26} />
        </Link>
        <div />
      </div>

      {state.phase === "intro" && (
        <IntroScreen
          quickCount={QUICK_COUNT}
          cardCount={cards.length}
          onStart={startQuestionnaire}
        />
      )}

      {state.phase === "question" && question && (
        <div className="flex flex-1 flex-col">
          <ProgressBar
            // Phase quick win : progression sur 3 ; affinage : sur 8 (parcours complet).
            current={inRefine ? answeredCount(state.answers) : quickWinAnsweredCount(state.answers)}
            step={state.step + 1}
            total={inRefine ? TOTAL_QUESTIONS : QUICK_COUNT}
          />

          <div key={state.step} className="animate-step mt-8 flex-1">
            <QuestionStep
              question={question}
              selectedOptionId={state.answers[question.id]}
              disabled={advancing}
              onSelect={(optionId) => handleSelect(question.id, optionId)}
            />

            {/* P9 — micro-confirmation de cohérence, non bloquante */}
            {coherenceMsg && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-900">
                  {coherenceMsg} Est-ce exact ? Cela nous aide à affiner votre
                  résultat.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={confirmCoherence}
                    className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
                  >
                    Oui, c&apos;est exact
                  </button>
                  <button
                    type="button"
                    onClick={fixCoherence}
                    className="rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
                  >
                    Corriger mes dépenses en devises
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-slate-500">
            Aucune donnée identifiante, aucun nom de banque demandé.
          </p>
        </div>
      )}

      {state.phase === "calculating" && (
        <CalculatingScreen cardCount={cards.length} />
      )}

      {state.phase === "quickResult" && engine && (
        <QuickResult
          current={engine.current}
          best={engine.ranked[0] ?? null}
          onRefine={startRefine}
          onSeeAll={seeAllCards}
        />
      )}

      {onResults && engine && (
        <ResultsPreview
          current={engine.current}
          ranked={engine.ranked}
          incomeDisclosed={incomeDisclosed}
          sessionId={sessionId}
          onRestart={handleRestart}
          onEdit={handleEdit}
        />
      )}
    </main>
  );
}

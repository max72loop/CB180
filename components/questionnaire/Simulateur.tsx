"use client";

// components/questionnaire/Simulateur.tsx
// Orchestrateur du simulateur : machine à phases
//   accroche → questions → calcul → résultats
// puis aperçu résultats. État 100 % en mémoire React (useReducer), aucun
// stockage navigateur persistant (contrainte RGPD / cahier des charges) :
// un retour sur la page pendant la session ne réinitialise pas les réponses (P7).

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Link from "next/link";
import {
  QUESTIONS,
  answersToProfile,
  answeredCount,
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
import ResultsPreview from "@/components/results/ResultsPreview";

interface SimulateurProps {
  cards: Card[];
}

/**
 * Priorité 4 — ordre d'AFFICHAGE des questions (présentation uniquement).
 * On commence par les questions faciles et engageantes (dépenses, profil) et on
 * place le revenu vers la fin, une fois l'utilisateur déjà engagé. N'affecte ni
 * les identifiants ni le mapping : `answersToProfile` retrouve chaque réponse
 * par son id, indépendamment de cet ordre.
 */
const DISPLAY_ORDER: QuestionId[] = [
  "monthlySpending",
  "profileType",
  "foreignShare",
  "travelFrequency",
  "foreignWithdrawals",
  "rewardsInterest",
  "currentFee",
  "income",
];

/** Index d'affichage de la question « part hors euro » (pour la correction P9). */
const FOREIGN_SHARE_STEP = DISPLAY_ORDER.indexOf("foreignShare");

type Phase = "intro" | "question" | "calculating" | "results";

interface State {
  phase: Phase;
  /** Index dans DISPLAY_ORDER (0..DISPLAY_ORDER.length-1). */
  step: number;
  answers: Answers;
}

type Action =
  | { type: "start" }
  | { type: "setAnswer"; qid: QuestionId; optionId: string }
  | { type: "advance" }
  | { type: "back" }
  | { type: "goto"; step: number }
  | { type: "calcDone" }
  | { type: "edit" }
  | { type: "restart" };

const LAST_STEP = DISPLAY_ORDER.length - 1;
/** Délai laissant voir la sélection confirmée avant de passer à l'écran suivant. */
const ADVANCE_DELAY_MS = 420;
/** Durée de l'écran de calcul avant l'affichage du résultat (P8). */
const CALC_DELAY_MS = 2200;

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
      // Dernière question atteinte ⇒ écran de calcul (P8), puis résultats.
      if (state.step >= LAST_STEP) return { ...state, phase: "calculating" };
      return { ...state, step: state.step + 1 };
    case "back":
      // Première question ⇒ retour à l'écran d'accroche.
      if (state.step <= 0) return { ...state, phase: "intro", step: 0 };
      return { ...state, step: state.step - 1 };
    case "goto":
      return {
        ...state,
        phase: "question",
        step: Math.min(Math.max(action.step, 0), LAST_STEP),
      };
    case "calcDone":
      return { ...state, phase: "results" };
    case "edit":
      // Depuis les résultats : revenir corriger la dernière question.
      return { ...state, phase: "question", step: LAST_STEP };
    case "restart":
      return { phase: "intro", step: 0, answers: {} };
    default:
      return state;
  }
}

/**
 * Priorité 9 — garde-fou de cohérence LÉGER (au plus un). Si l'utilisateur
 * déclare voyager souvent hors Europe mais quasiment aucune dépense en devises,
 * on propose une micro-confirmation NON bloquante. Renvoie le message ou null.
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
  });
  const [advancing, setAdvancing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  // P9 : message de cohérence en attente + mémoire d'acquittement (une fois suffit).
  const [coherenceMsg, setCoherenceMsg] = useState<string | null>(null);
  const coherenceAckd = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audited = useRef(false);

  const currentQid = DISPLAY_ORDER[state.step];
  const question = QUESTIONS.find((q) => q.id === currentQid);
  const onResults = state.phase === "results";
  const incomeDisclosed = isIncomeDisclosed(state.answers);

  // Nettoyage du timer d'auto-avance au démontage.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
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
    dispatch({ type: "back" });
  }, []);

  const startQuestionnaire = useCallback(() => {
    dispatch({ type: "start" });
  }, []);

  // Calcul dérivé (moteur pur) mémoïsé sur les réponses. P5 : on n'applique
  // jamais de filtre d'éligibilité (onlyEligible: false) ; si le revenu n'est pas
  // renseigné, l'affichage masque en plus les mentions de conditions de revenu.
  const results = useMemo(() => {
    if (!isComplete(state.answers)) return null;
    const profile = answersToProfile(state.answers);
    return {
      current: computeCurrentSituationCost(profile),
      ranked: rankCards(cards, profile, { onlyEligible: false }),
    };
  }, [state.answers, cards]);

  // Écran de calcul (P8) : temporisation avant de révéler le résultat.
  useEffect(() => {
    if (state.phase !== "calculating") return;
    const id = setTimeout(() => dispatch({ type: "calcDone" }), CALC_DELAY_MS);
    return () => clearTimeout(id);
  }, [state.phase]);

  // À l'arrivée sur les résultats : enregistre l'audit anonymisé (fourchettes
  // + résultat), une seule fois. Fire-and-forget : un échec réseau/DB ne casse
  // jamais le parcours utilisateur.
  useEffect(() => {
    if (!onResults || !results || audited.current) return;
    audited.current = true;
    fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: answersToAuditProfile(state.answers),
        result: buildAuditResult(results.current, results.ranked),
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.sessionId) setSessionId(data.sessionId);
      })
      .catch(() => {
        /* silencieux : le stockage est optionnel côté UX */
      });
  }, [onResults, results, state.answers]);

  const handleRestart = useCallback(() => {
    audited.current = false;
    coherenceAckd.current = false;
    setSessionId(null);
    setCoherenceMsg(null);
    dispatch({ type: "restart" });
  }, []);

  const handleEdit = useCallback(() => {
    audited.current = false;
    dispatch({ type: "edit" });
  }, []);

  const showBack = state.phase === "question";

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
          questionCount={QUESTIONS.length}
          onStart={startQuestionnaire}
        />
      )}

      {state.phase === "question" && question && (
        <div className="flex flex-1 flex-col">
          <ProgressBar
            current={answeredCount(state.answers)}
            step={state.step + 1}
            total={QUESTIONS.length}
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

      {state.phase === "calculating" && <CalculatingScreen />}

      {onResults && results && (
        <ResultsPreview
          current={results.current}
          ranked={results.ranked}
          incomeDisclosed={incomeDisclosed}
          sessionId={sessionId}
          onRestart={handleRestart}
          onEdit={handleEdit}
        />
      )}
    </main>
  );
}

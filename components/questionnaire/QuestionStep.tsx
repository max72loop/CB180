"use client";

// components/questionnaire/QuestionStep.tsx
// Une question par écran. Deux mises en page distinctes via les breakpoints :
//   • mobile  : ProgressBar fine, intitulé + aide, cartes-réponses empilées
//     pleine largeur, rassurance en bas.
//   • desktop : « rail vivant + grille » — colonne gauche = StepRail sticky
//     (stepper vertical des 6 étapes, profil qui se dessine, rassurance +
//     astuce clavier), colonne droite = intitulé large + grille de réponses
//     sur 2 colonnes qui occupe l'écran.
//
// Navigation 100 % au clic/tap, ET clavier optionnel sur desktop (jamais imposé,
// aucune saisie) : touches 1-9 pour choisir, ↑/↓ pour déplacer le focus, Entrée
// pour valider, ←/Échap pour revenir. Le clavier ne fait que sélectionner des
// options existantes — il n'introduit aucun champ de saisie.
//
// Présentationnel : ne gère pas l'état des réponses, remonte la sélection.

import { useEffect, useState } from "react";
import {
  DISPLAY_ORDER,
  answeredCount,
  quickWinAnsweredCount,
  type Answers,
  type Question,
} from "@/lib/answers";
import AnswerCard from "./AnswerCard";
import ProgressBar from "./ProgressBar";
import StepRail from "./StepRail";

interface QuestionStepProps {
  question: Question;
  selectedOptionId?: string;
  /** Toutes les réponses déjà données (rail desktop + progression mobile). */
  answers: Answers;
  /** Index 0-based de la question courante dans DISPLAY_ORDER. */
  stepIndex: number;
  /** Nombre de questions de la phase quick win (frontière de phase). */
  quickCount: number;
  onSelect: (optionId: string) => void;
  /** Retour arrière (déclenché aussi par ← / Échap au clavier). */
  onBack?: () => void;
  /** Désactive les options pendant la transition d'auto-avance. */
  disabled?: boolean;
  /** Active les raccourcis clavier (désactivés pendant une micro-confirmation). */
  keyboardEnabled?: boolean;
}

export default function QuestionStep({
  question,
  selectedOptionId,
  answers,
  stepIndex,
  quickCount,
  onSelect,
  onBack,
  disabled = false,
  keyboardEnabled = true,
}: QuestionStepProps) {
  const titleId = `q-${question.id}-title`;
  const options = question.options;
  // Index ciblé par les flèches (−1 = aucun tant que l'utilisateur n'a pas navigué).
  const [focusIdx, setFocusIdx] = useState(-1);

  // Réinitialise le focus clavier à chaque changement de question.
  useEffect(() => {
    setFocusIdx(-1);
  }, [question.id]);

  // Raccourcis clavier globaux (desktop) : ne captent rien tant qu'ils sont
  // désactivés ou qu'une transition est en cours. Aucun effet sur mobile (pas de
  // clavier physique), donc inoffensif.
  useEffect(() => {
    if (!keyboardEnabled || disabled) return;

    function onKeyDown(e: KeyboardEvent) {
      // Ne pas interférer avec une éventuelle saisie (aucune sur cet écran, garde-fou).
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      // Touches 1-9 : sélection directe de l'option correspondante.
      if (/^[1-9]$/.test(e.key)) {
        const idx = Number(e.key) - 1;
        if (idx < options.length) {
          e.preventDefault();
          setFocusIdx(idx);
          onSelect(options[idx].id);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
          e.preventDefault();
          setFocusIdx((i) => Math.min((i < 0 ? -1 : i) + 1, options.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusIdx((i) => Math.max((i < 0 ? options.length : i) - 1, 0));
          break;
        case "ArrowLeft":
          // Flèche gauche = retour (cohérent avec le bouton « ← Retour »).
          if (onBack) {
            e.preventDefault();
            onBack();
          }
          break;
        case "Enter":
        case " ":
          if (focusIdx >= 0 && focusIdx < options.length) {
            e.preventDefault();
            onSelect(options[focusIdx].id);
          }
          break;
        case "Escape":
          if (onBack) {
            e.preventDefault();
            onBack();
          }
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [keyboardEnabled, disabled, options, focusIdx, onSelect, onBack]);

  // Progression mobile : phase quick win = « x sur 3 », affinage = « x sur 6 ».
  const quickPhase = stepIndex < quickCount;
  const progressCurrent = quickPhase
    ? quickWinAnsweredCount(answers)
    : answeredCount(answers);
  const progressTotal = quickPhase ? quickCount : DISPLAY_ORDER.length;

  return (
    <div className="flex w-full flex-1 flex-col">
      {/* Barre de progression fine : mobile uniquement (le rail la remplace sur desktop). */}
      <div className="md:hidden">
        <ProgressBar
          current={progressCurrent}
          step={stepIndex + 1}
          total={progressTotal}
        />
      </div>

      <div className="mt-6 md:mt-2 md:grid md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] md:items-start md:gap-10 lg:gap-14">
        {/* Colonne gauche desktop : le rail vivant, sticky. */}
        <StepRail
          answers={answers}
          stepIndex={stepIndex}
          quickCount={quickCount}
          optionCount={options.length}
        />

        {/* Colonne droite desktop / corps mobile : intitulé + réponses. */}
        <div className="min-w-0">
          <h2
            id={titleId}
            className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl md:leading-snug"
          >
            {question.title}
          </h2>
          {question.help && (
            <p className="mt-2 text-sm leading-relaxed text-slate-500 md:text-base">
              {question.help}
            </p>
          )}

          {/* Empilées pleine largeur sur mobile, grille 2 colonnes sur desktop. */}
          <ul
            role="radiogroup"
            aria-labelledby={titleId}
            className="mt-6 space-y-3 md:mt-8 md:grid md:grid-cols-2 md:gap-3 md:space-y-0"
          >
            {options.map((option, i) => (
              <li key={option.id}>
                <AnswerCard
                  qid={question.id}
                  optionId={option.id}
                  label={option.label}
                  hint={option.hint}
                  index={i + 1}
                  selected={option.id === selectedOptionId}
                  focused={i === focusIdx}
                  disabled={disabled}
                  onSelect={() => onSelect(option.id)}
                />
              </li>
            ))}
          </ul>

          {/* Rassurance : mobile uniquement (le rail la porte sur desktop). */}
          <p className="mt-8 text-xs leading-relaxed text-slate-400 md:hidden">
            Aucune donnée identifiante, aucun nom de banque demandé.
          </p>
        </div>
      </div>
    </div>
  );
}

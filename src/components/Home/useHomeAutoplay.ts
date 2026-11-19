import { useEffect, useRef, type RefObject } from 'react';
import { useHomeMotion } from './homeMotionContext';

/** Pause the card area, not the whole section; mouse clicks must not leave a sticky focus pause. */
export function useHomeAutoplay(target: RefObject<HTMLElement | null>, delay: number, enabled: boolean,
  advance: () => void, interactionScope?: string) {
  const callback = useRef(advance);
  const motion = useHomeMotion();
  useEffect(() => { callback.current = advance; }, [advance]);
  useEffect(() => {
    const node = target.current;
    if (!node) return;
    const interaction = interactionScope ? node.querySelector<HTMLElement>(interactionScope) ?? node : node;
    let visible = false;
    let hovered = window.matchMedia('(any-hover: hover)').matches && interaction.matches(':hover');
    let held = false;
    let focused = !!document.activeElement?.matches(':focus-visible') && interaction.contains(document.activeElement);
    let timer: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      const allowed = enabled && motion.enabled && visible && !hovered && !held && !focused && !document.hidden;
      if (allowed && !timer) timer = setInterval(() => callback.current(), delay);
      if (!allowed && timer) { clearInterval(timer); timer = undefined; }
    };
    const enter = (event: PointerEvent) => { if (event.pointerType !== 'touch') { hovered = true; sync(); } };
    const leave = () => { hovered = false; sync(); };
    const down = () => { held = true; sync(); };
    const up = () => { held = false; sync(); };
    const focus = () => { focused = !!document.activeElement?.matches(':focus-visible') && interaction.contains(document.activeElement); sync(); };
    const blur = (event: FocusEvent) => { focused = event.relatedTarget instanceof Element && event.relatedTarget.matches(':focus-visible') && interaction.contains(event.relatedTarget); sync(); };
    const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); sync(); }, { threshold: 0 });
    observer.observe(node);
    interaction.addEventListener('pointerenter', enter); interaction.addEventListener('pointerleave', leave);
    interaction.addEventListener('pointerdown', down); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    interaction.addEventListener('focusin', focus); interaction.addEventListener('focusout', blur);
    document.addEventListener('visibilitychange', sync);
    return () => {
      clearInterval(timer); observer.disconnect();
      interaction.removeEventListener('pointerenter', enter); interaction.removeEventListener('pointerleave', leave);
      interaction.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      interaction.removeEventListener('focusin', focus); interaction.removeEventListener('focusout', blur);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [target, delay, enabled, interactionScope, motion.enabled]);
}

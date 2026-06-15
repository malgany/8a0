export default async function fillLineup({ tab }) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const randomItem = (items) => items[Math.floor(Math.random() * items.length)];
  const getState = async () =>
    tab.playwright.evaluate(`(() => {
      const visible = (element) => {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          rect.bottom > 0 &&
          rect.right > 0 &&
          rect.top < window.innerHeight &&
          rect.left < window.innerWidth &&
          style.visibility !== "hidden" &&
          style.display !== "none"
        );
      };
      const center = (element) => {
        const rect = element.getBoundingClientRect();
        return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) };
      };
      const text = (element) => (element.textContent || "").replace(/\\s+/g, " ").trim();
      const buttons = [...document.querySelectorAll("button")].filter((button) => !button.disabled && visible(button));
      const roll = buttons.find((button) => /sortear|roll|lanzar/i.test(text(button)));
      const rerolls = [...document.querySelectorAll(".reroll-btn, button")]
        .filter((button) => !button.disabled && visible(button) && /outra|another|vuelve|re-roll/i.test(text(button)))
        .map(center);
      return {
        filled: document.querySelectorAll(".disc.slot-filled").length,
        roll: roll ? center(roll) : null,
        rerolls,
        players: [...document.querySelectorAll(".player-card:not(:disabled)")].filter(visible).map(center),
        slots: [...document.querySelectorAll(".disc.slot-active.slot-pickable")].filter(visible).map(center),
      };
    })()`);
  const clickPoint = async (point) => {
    await tab.cua.click({ x: point.x, y: point.y });
    await sleep(220);
  };
  const waitForState = async (predicate, timeout = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const state = await getState();
      if (predicate(state)) return state;
      await sleep(120);
    }
    return getState();
  };

  let loops = 0;
  const maxLoops = 80;
  let state = await getState();

  while (state.filled < 11 && loops < maxLoops) {
    loops += 1;

    if (state.players.length === 0) {
      if (state.roll) {
        await clickPoint(state.roll);
        state = await waitForState((next) => next.players.length > 0 || next.rerolls.length > 0, 6000);
      } else if (state.rerolls.length > 0) {
        await clickPoint(randomItem(state.rerolls));
        state = await waitForState((next) => next.players.length > 0, 6000);
      } else {
        break;
      }
    }

    if (state.players.length === 0) {
      state = await getState();
      continue;
    }

    await clickPoint(randomItem(state.players));
    state = await waitForState((next) => next.slots.length > 0, 2500);
    if (state.slots.length === 0) {
      state = await getState();
      continue;
    }

    await clickPoint(randomItem(state.slots));
    state = await waitForState((next) => next.filled > state.filled || next.players.length === 0, 2500);
  }

  return {
    filled: state.filled,
    complete: state.filled >= 11,
    loops,
  };
}

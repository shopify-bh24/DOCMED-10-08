"use strict";

// initialize when page loads
document.addEventListener("DOMContentLoaded", initLoadMoreCareer);

document.addEventListener("shopify:section:load", (event) => {
  const id = event.detail.sectionId;
  const section = event.target.querySelector(`[data-id="${id}"]`);
  if (!section) return;

  if (section.querySelector(".bls-carrer__content")) {
    initLoadMoreCareer();
  }
});

function initLoadMoreCareer() {
  const content = document.querySelector(".bls-carrer__content");
  const loadMoreBtn = document.querySelector(".load-carrer");
  const progressBar = document.querySelector(".load-more-percent");
  const counter = document.querySelector(".limit-carrer");

  if (!content || !loadMoreBtn || !progressBar || !counter) return;

  const items = Array.from(content.querySelectorAll(".bls-carrer__item"));
  const limit = Number(content.dataset.limit);
  const total = items.length;

  let shown = limit;
 
  // initially hide items beyond the limit
  items.forEach((item, index) => {
    if (index >= limit) {
      item.setAttribute("data-hide", true);
    }
  });

  updateUI();

  loadMoreBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const nextShown = Math.min(shown + limit, total);

    for (let i = shown; i < nextShown; i++) {
      items[i].setAttribute("data-hide", false);
    }

    shown = nextShown;

    updateUI();

    if (shown >= total) {
      loadMoreBtn.style.display = "none";
    }
  });

  function updateUI() {
    const visibleCount = items.filter(
      (el) => el.getAttribute("data-hide") !== "true"
    ).length;

    counter.textContent = visibleCount;

    const percent = Math.round((visibleCount * 100) / total);
    progressBar.style.width = `${percent}%`;
  }
}

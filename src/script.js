"use strict";

const dropdownBtn = document.getElementById("dropdown-menu-btn");
const dropdownMenu = document.getElementById("dropdown-menu");

// Toggle dropdown open/close
dropdownBtn.addEventListener("click", () => {
  dropdownMenu.classList.toggle("hidden");
  dropdownMenu.classList.toggle("flex");
});

// Close when clicking outside
document.addEventListener("click", (e) => {
  if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
    dropdownMenu.classList.add("hidden");
    dropdownMenu.classList.remove("flex");
  }
});

// Handle checkmark selection
document.querySelectorAll(".option-row").forEach((btn) => {
  btn.addEventListener("click", () => {
    const group = btn.dataset.group;
    // Uncheck all in this group
    document
      .querySelectorAll(`.option-row[data-group="${group}"] .check`)
      .forEach((el) => el.classList.add("hidden"));
    // Check the selected one
    btn.querySelector(".check").classList.remove("hidden");
  });
});

//Dropdown menu for days
const dropdownDayMenuBtn = document.getElementById("dropdown-day-menu-btn");
const dropdownDayMenu = document.getElementById("dropdown-day-menu");
// Toggle dropdown open/close
dropdownDayMenuBtn.addEventListener("click", () => {
  dropdownDayMenu.classList.toggle("hidden");
  dropdownDayMenu.classList.toggle("flex");
});

// Close when clicking outside
document.addEventListener("click", (e) => {
  if (
    !dropdownDayMenuBtn.contains(e.target) &&
    !dropdownDayMenu.contains(e.target)
  ) {
    dropdownDayMenu.classList.add("hidden");
    dropdownDayMenu.classList.remove("flex");
  }
});

//selection day
const dayButtons = document.querySelectorAll('[data-group="days"]');
const daySet = document.getElementById("daySet");

dayButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const spanText = button.querySelector("span").textContent;
    daySet.textContent = spanText;
  });
});

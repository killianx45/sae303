"use strict";

const lien = document.querySelectorAll('a[href^="#"]');

lien.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const id = link.getAttribute("href").substring(1);
    const target = document.getElementById(id);
    target.scrollIntoView({
      behavior: "smooth",
    });
  });
});

function toggleNavbar() {
  const navbar = document.getElementById("navbar");
  navbar.classList.toggle("rounded-full");
}

document.addEventListener("DOMContentLoaded", function () {
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  };

  const fadeInElements = document.querySelectorAll(".scroll-item");

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.remove("opacity-0", "translate-y-10");
        entry.target.classList.add("opacity-100", "translate-y-0");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  fadeInElements.forEach((element) => {
    observer.observe(element);
  });
});

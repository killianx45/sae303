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

const scrollItems = document.querySelectorAll(".scroll-item");

const observerOptions = {
  root: null, // Utilise le viewport
  rootMargin: "0px",
  threshold: 0.1, // 10% de l'élément visible
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target); // Arrête d'observer une fois visible
    }
  });
}, observerOptions);

// Observer chaque élément
scrollItems.forEach((item) => {
  observer.observe(item);
});

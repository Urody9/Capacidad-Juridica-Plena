document.addEventListener('DOMContentLoaded', () => {
  // selectores principales del DOM
  const htmlElement = document.documentElement;
  const allSections = Array.from(document.querySelectorAll('.presentation-section'));
  const speakerSection = document.getElementById('notas-expositor');

  const topNavBar = document.querySelector('.top-nav-bar');
  const announcementBar = document.querySelector('.announcement-bar');

  const progressBar = document.getElementById('progress-indicator');
  const presentationProgress = document.getElementById('presentation-progress');
  const btnStartPresentation = document.getElementById('btn-start-presentation');
  const allNavLinks = Array.from(document.querySelectorAll('.nav-link'));

  // Controles de Menu Hamburguesa y Panel Lateral
  const btnMenuToggle = document.getElementById('btn-menu-toggle');
  const accessibilityDrawer = document.getElementById('accessibility-drawer');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');

  // Herramientas de Accesibilidad y Exposición dentro del Drawer
  const btnFontSize = document.getElementById('btn-font-size');
  const btnEasyRead = document.getElementById('btn-easy-read');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const btnToggleNotes = document.getElementById('btn-toggle-notes');
  const themeLabel = document.getElementById('theme-label');
  const a11yAnnouncer = document.getElementById('a11y-announcer');

  let currentSectionIndex = 0;
  let isProgrammaticScroll = false;
  let scrollTimeout = null;

  // Helpers para obtener unicamente las secciones y enlaces activos (visibles)
  function getActiveSections() {
    return allSections.filter((section) => !section.hidden);
  }

  function getActiveNavLinks() {
    return allNavLinks.filter((link) => {
      const parentLi = link.closest('li');
      return !parentLi || !parentLi.hidden;
    });
  }

  // Sincronizacion dinamica de altura del encabezado
  function syncHeaderHeight() {
    const topNavHeight = topNavBar ? topNavBar.offsetHeight : 0;
    const announcementHeight = announcementBar ? announcementBar.offsetHeight : 0;
    htmlElement.style.setProperty('--header-height', `${topNavHeight + announcementHeight}px`);
  }

  syncHeaderHeight();

  if ('ResizeObserver' in window) {
    const headerResizeObserver = new ResizeObserver(syncHeaderHeight);
    if (topNavBar) headerResizeObserver.observe(topNavBar);
    if (announcementBar) headerResizeObserver.observe(announcementBar);
  }

  // FUNCION DE ANUNCIOS ACCESIBLES (ARIA-LIVE)
  function announceToScreenReader(message) {
    if (!a11yAnnouncer) return;
    a11yAnnouncer.textContent = '';
    setTimeout(() => {
      a11yAnnouncer.textContent = message;
    }, 50);
  }

  // NAVEGACION PASO A PASO ENTRE SECCIONES
  function updateProgressUI(index) {
    const activeSections = getActiveSections();
    const activeNavLinks = getActiveNavLinks();
    const totalCount = activeSections.length;

    if (totalCount === 0) return;

    const safeIndex = Math.max(0, Math.min(index, totalCount - 1));
    currentSectionIndex = safeIndex;
    const currentNumber = safeIndex + 1;

    const percentage = (currentNumber / totalCount) * 100;
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }
    if (presentationProgress) {
      presentationProgress.setAttribute('aria-valuemax', totalCount);
      presentationProgress.setAttribute('aria-valuenow', currentNumber);
    }

    activeNavLinks.forEach((link, idx) => {
      if (idx === safeIndex) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'step');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  function goToSection(index, shouldFocus = true) {
    const activeSections = getActiveSections();
    if (index < 0 || index >= activeSections.length) return;

    const targetSection = activeSections[index];
    if (!targetSection) return;

    const headerOffset = (topNavBar ? topNavBar.offsetHeight : 0)
      + (announcementBar ? announcementBar.offsetHeight : 0)
      + 16;

    // Pausar actualizaciones del IntersectionObserver durante el desplazamiento suave
    isProgrammaticScroll = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isProgrammaticScroll = false;
    }, 900);

    const applyNavigation = () => {
      const targetTop = targetSection.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
      updateProgressUI(index);

      if (shouldFocus) {
        const heading = targetSection.querySelector('h1, h2');
        if (heading) {
          if (!heading.hasAttribute('tabindex')) {
            heading.setAttribute('tabindex', '-1');
          }
          heading.focus({ preventScroll: true });
        }
      }
    };

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        applyNavigation();
      });
    } else {
      applyNavigation();
    }
  }

  window.addEventListener('scrollend', () => {
    isProgrammaticScroll = false;
    clearTimeout(scrollTimeout);
  });

  if (btnStartPresentation) {
    btnStartPresentation.addEventListener('click', () => {
      goToSection(1);
    });
  }

  allNavLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const activeNavLinks = getActiveNavLinks();
      const visibleIdx = activeNavLinks.indexOf(link);
      if (visibleIdx !== -1) {
        goToSection(visibleIdx);
      }
    });
  });

  // CONTROL DEL MENU HAMBURGUESA
  function openDrawer() {
    if (!accessibilityDrawer) return;
    accessibilityDrawer.classList.add('drawer-open');
    accessibilityDrawer.removeAttribute('inert');
    if (drawerBackdrop) drawerBackdrop.classList.add('backdrop-active');
    if (btnMenuToggle) btnMenuToggle.setAttribute('aria-expanded', 'true');
    if (btnCloseDrawer) btnCloseDrawer.focus();
    announceToScreenReader('Panel de opciones abierto.');
  }

  function closeDrawer() {
    if (!accessibilityDrawer) return;
    accessibilityDrawer.classList.remove('drawer-open');
    accessibilityDrawer.setAttribute('inert', '');
    if (drawerBackdrop) drawerBackdrop.classList.remove('backdrop-active');
    if (btnMenuToggle) {
      btnMenuToggle.setAttribute('aria-expanded', 'false');
      btnMenuToggle.focus();
    }
    announceToScreenReader('Panel de opciones cerrado.');
  }

  if (btnMenuToggle) {
    btnMenuToggle.addEventListener('click', () => {
      const isOpen = accessibilityDrawer && accessibilityDrawer.classList.contains('drawer-open');
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  }

  if (btnCloseDrawer) {
    btnCloseDrawer.addEventListener('click', closeDrawer);
  }

  if (drawerBackdrop) {
    drawerBackdrop.addEventListener('click', closeDrawer);
  }

  // ATAJOS DE TECLADO (← / → y Esc para el Panel)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && accessibilityDrawer && accessibilityDrawer.classList.contains('drawer-open')) {
      e.preventDefault();
      closeDrawer();
      return;
    }

    const openDialog = document.querySelector('dialog[open]');
    if (openDialog) return;

    const activeTagName = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTagName === 'input' || activeTagName === 'textarea' || activeTagName === 'select') {
      return;
    }

    const activeSections = getActiveSections();
    const totalCount = activeSections.length;

    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      if (currentSectionIndex < totalCount - 1) {
        e.preventDefault();
        goToSection(currentSectionIndex + 1);
        announceToScreenReader(`Avanzaste a la sección ${currentSectionIndex + 1} de ${totalCount}`);
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      if (currentSectionIndex > 0) {
        e.preventDefault();
        goToSection(currentSectionIndex - 1);
        announceToScreenReader(`Retrocediste a la sección ${currentSectionIndex + 1} de ${totalCount}`);
      }
    }
  });

  // OBSERVADOR DE INTERSECCION (SINCRONIZACION AL SCROLLEAR)
  const totalHeaderHeight = (topNavBar ? topNavBar.offsetHeight : 0)
    + (announcementBar ? announcementBar.offsetHeight : 0);
  const observerTopMargin = `-${totalHeaderHeight + 20}px`;

  const sectionObserver = new IntersectionObserver((entries) => {
    if (isProgrammaticScroll) return;

    entries.forEach((entry) => {
      if (entry.isIntersecting && !entry.target.hidden) {
        const activeSections = getActiveSections();
        const newIndex = activeSections.indexOf(entry.target);
        if (newIndex !== -1) {
          updateProgressUI(newIndex);
        }
      }
    });
  }, {
    root: null,
    rootMargin: `${observerTopMargin} 0px -40% 0px`,
    threshold: 0
  });

  allSections.forEach((section) => sectionObserver.observe(section));

  // GESTION MODERNA DE <dialog> VISTA ENFOCADA DE PILARES
  // CONTROL DE PESTAÑAS EDITORIALES (SECCIÓN 3: LO MÁS IMPORTANTE)
  const editorialTabs = Array.from(document.querySelectorAll('.editorial-tab-btn'));
  const editorialPanels = Array.from(document.querySelectorAll('.editorial-panel'));

  function activateEditorialTab(targetTab, shouldFocus = false) {
    editorialTabs.forEach((tab) => {
      const isSelected = tab === targetTab;
      tab.classList.toggle('active', isSelected);
      tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      tab.setAttribute('tabindex', isSelected ? '0' : '-1');
    });

    const targetPanelId = targetTab.getAttribute('aria-controls');
    editorialPanels.forEach((panel) => {
      panel.hidden = panel.id !== targetPanelId;
    });

    if (shouldFocus) {
      targetTab.focus();
    }

    const label = targetTab.querySelector('.tab-label')?.textContent || '';
    announceToScreenReader(`Mostrando eje: ${label}`);
  }

  editorialTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      activateEditorialTab(tab, false);
    });

    tab.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (index + 1) % editorialTabs.length;
        activateEditorialTab(editorialTabs[nextIndex], true);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (index - 1 + editorialTabs.length) % editorialTabs.length;
        activateEditorialTab(editorialTabs[prevIndex], true);
      }
    });
  });

  const pillarCards = document.querySelectorAll('.pillar-card');
  pillarCards.forEach((card) => {
    const focusBtn = card.querySelector('.btn-card-focus');
    const modalId = focusBtn ? focusBtn.getAttribute('data-pillar-id') : null;
    const targetModal = modalId ? document.getElementById(modalId) : null;

    if (!targetModal) return;

    focusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      targetModal.showModal();
      announceToScreenReader('Vista ampliada para exposición abierta. Presiona Esc para cerrar.');
    });

    card.addEventListener('click', () => {
      targetModal.showModal();
      announceToScreenReader('Vista ampliada para exposición abierta. Presiona Esc para cerrar.');
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        targetModal.showModal();
        announceToScreenReader('Vista ampliada para exposición abierta. Presiona Esc para cerrar.');
      }
    });
  });

  // Modo Proyector
  if (btnFontSize) {
    const statusSpan = btnFontSize.querySelector('.tool-status');
    const savedProjectorMode = localStorage.getItem('pag_exp_projector_mode') === 'true';
    if (savedProjectorMode) {
      htmlElement.classList.add('projector-mode');
      btnFontSize.setAttribute('aria-pressed', 'true');
      if (statusSpan) statusSpan.textContent = 'Activado';
    }

    btnFontSize.addEventListener('click', () => {
      const isProjector = htmlElement.classList.toggle('projector-mode');
      btnFontSize.setAttribute('aria-pressed', isProjector ? 'true' : 'false');
      if (statusSpan) statusSpan.textContent = isProjector ? 'Activado' : 'Desactivado';
      localStorage.setItem('pag_exp_projector_mode', isProjector ? 'true' : 'false');
      syncHeaderHeight();

      const message = isProjector
        ? 'Modo Proyector activado: fuentes ampliadas y fondo plano de alta visibilidad'
        : 'Modo Proyector desactivado';
      announceToScreenReader(message);
    });
  }

  // Modo Lectura Facil y Alto Contraste
  if (btnEasyRead) {
    const statusSpan = btnEasyRead.querySelector('.tool-status');
    const savedEasyRead = localStorage.getItem('pag_exp_easy_read') === 'true';
    if (savedEasyRead) {
      htmlElement.classList.add('easy-read-mode');
      btnEasyRead.setAttribute('aria-pressed', 'true');
      if (statusSpan) statusSpan.textContent = 'Activado';
    }

    btnEasyRead.addEventListener('click', () => {
      const isEasyRead = htmlElement.classList.toggle('easy-read-mode');
      btnEasyRead.setAttribute('aria-pressed', isEasyRead ? 'true' : 'false');
      if (statusSpan) statusSpan.textContent = isEasyRead ? 'Activado' : 'Desactivado';
      localStorage.setItem('pag_exp_easy_read', isEasyRead ? 'true' : 'false');
      syncHeaderHeight();

      const message = isEasyRead
        ? 'Modo Lectura Fácil activado: alto contraste y fondo plano'
        : 'Modo Lectura Fácil desactivado';
      announceToScreenReader(message);
    });
  }

  // Modo Claro / Oscuro
  if (btnThemeToggle) {
    const statusSpan = btnThemeToggle.querySelector('.tool-status');
    const savedTheme = localStorage.getItem('pag_exp_theme');
    if (savedTheme) {
      htmlElement.setAttribute('data-theme', savedTheme);
      btnThemeToggle.setAttribute('aria-pressed', savedTheme === 'dark' ? 'true' : 'false');
      if (statusSpan) statusSpan.textContent = savedTheme === 'dark' ? 'Modo Oscuro' : 'Modo Claro';
      if (themeLabel) themeLabel.textContent = savedTheme === 'dark' ? 'Tema Claro' : 'Tema Oscuro';
    }

    btnThemeToggle.addEventListener('click', () => {
      const currentTheme = htmlElement.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

      const newTheme = (currentTheme === 'dark') ? 'light' : 'dark';
      htmlElement.setAttribute('data-theme', newTheme);
      btnThemeToggle.setAttribute('aria-pressed', newTheme === 'dark' ? 'true' : 'false');
      if (statusSpan) statusSpan.textContent = newTheme === 'dark' ? 'Modo Oscuro' : 'Modo Claro';
      if (themeLabel) themeLabel.textContent = newTheme === 'dark' ? 'Tema Claro' : 'Tema Oscuro';
      localStorage.setItem('pag_exp_theme', newTheme);

      announceToScreenReader(`Tema visual cambiado a modo ${newTheme === 'dark' ? 'oscuro' : 'claro'}`);
    });
  }

  // Ocultar / Mostrar Seccion 7
  function setNotesVisibility(hideNotes, shouldAnnounce = true) {
    if (!speakerSection) return;

    speakerSection.hidden = hideNotes;

    const notesNavLink = allNavLinks.find((link) => link.getAttribute('href') === '#notas-expositor');
    if (notesNavLink && notesNavLink.parentElement) {
      notesNavLink.parentElement.hidden = hideNotes;
    }

    if (hideNotes) {
      sectionObserver.unobserve(speakerSection);
    } else {
      sectionObserver.observe(speakerSection);
    }

    if (btnToggleNotes) {
      const statusSpan = btnToggleNotes.querySelector('.tool-status');
      btnToggleNotes.setAttribute('aria-pressed', hideNotes ? 'true' : 'false');
      if (statusSpan) statusSpan.textContent = hideNotes ? 'Ocultas' : 'Visibles';
    }

    localStorage.setItem('pag_exp_hide_notes', hideNotes ? 'true' : 'false');
    syncHeaderHeight();

    const activeSections = getActiveSections();
    if (currentSectionIndex >= activeSections.length) {
      goToSection(activeSections.length - 1, false);
    } else {
      updateProgressUI(currentSectionIndex);
    }

    if (shouldAnnounce) {
      const message = hideNotes
        ? 'Sección 7 de notas del expositor oculta para presentación'
        : 'Sección 7 de notas del expositor visible';
      announceToScreenReader(message);
    }
  }

  if (btnToggleNotes) {
    const savedHideNotes = localStorage.getItem('pag_exp_hide_notes') === 'true';
    setNotesVisibility(savedHideNotes, false);

    btnToggleNotes.addEventListener('click', () => {
      const currentlyHidden = speakerSection ? speakerSection.hidden : false;
      setNotesVisibility(!currentlyHidden, true);
    });
  } else {
    updateProgressUI(0);
  }
});
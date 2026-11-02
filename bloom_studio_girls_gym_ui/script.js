/* Bloom Studio interactions: class filters, booking demo, water tracker, goals, mobile nav. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const toastElement = $('#liveToast');
  const toast = window.bootstrap && toastElement ? bootstrap.Toast.getOrCreateInstance(toastElement, { delay: 3200 }) : null;

  function notify(message) {
    $('#toastMessage').textContent = message;
    if (toast) toast.show();
    else window.alert(message);
  }

  // Friendly local date in the header.
  const now = new Date();
  $('#todayLabel').textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const dateInput = $('#bookingDate');
  if (dateInput) {
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    dateInput.min = localDate;
    dateInput.value = localDate;
  }

  // Animate content into view without requiring a library.
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }
  // Make the first viewport visible immediately.
  revealItems.slice(0, 2).forEach(item => item.classList.add('is-visible'));

  // Filter class cards by category.
  $$('.filter-chip').forEach(button => {
    button.addEventListener('click', () => {
      $$('.filter-chip').forEach(chip => chip.classList.toggle('active', chip === button));
      const filter = button.dataset.filter;
      $$('.class-col').forEach(card => {
        const shouldShow = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-hidden', !shouldShow);
        if (shouldShow) {
          card.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 260, easing: 'ease-out' });
        }
      });
    });
  });

  // Open booking modal with a preselected class when a card is clicked.
  const bookingModalEl = $('#bookingModal');
  const bookingModal = bookingModalEl && window.bootstrap ? bootstrap.Modal.getOrCreateInstance(bookingModalEl) : null;
  $$('.book-class').forEach(button => {
    button.addEventListener('click', () => {
      $('#classSelect').value = button.dataset.class || '';
      if (bookingModal) bookingModal.show();
    });
  });
  $('#bookingForm').addEventListener('submit', event => {
    event.preventDefault();
    const className = $('#classSelect').value;
    const date = new Date(`${dateInput.value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const time = $('#bookingTime').value;
    if (!className || !dateInput.value || !time) return;
    const item = document.createElement('div');
    item.className = 'upcoming-item booking-added';
    const day = new Date(`${dateInput.value}T12:00:00`).getDate();
    const month = new Date(`${dateInput.value}T12:00:00`).toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
    item.innerHTML = `<div class="date-tile"><b>${day}</b><small>${month}</small></div><div class="upcoming-info"><b></b><span><i class="bi bi-clock"></i> </span></div><span class="spots-pill spots-full">Booked</span><button class="icon-button cancel-booking" aria-label="Remove booking"><i class="bi bi-x-lg"></i></button>`;
    $('.upcoming-info b', item).textContent = className;
    $('.upcoming-info span', item).append(document.createTextNode(`${time} · Studio`));
    $('#upcomingList').prepend(item);
    attachCancel(item.querySelector('.cancel-booking'));
    if (bookingModal) bookingModal.hide();
    event.target.reset();
    dateInput.value = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    notify(`${className} added to your schedule for ${date} at ${time}.`);
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // Upcoming class cancellation is a front-end demo action.
  function attachCancel(button) {
    button.addEventListener('click', () => {
      const row = button.closest('.upcoming-item');
      const name = $('.upcoming-info b', row)?.textContent || 'Class';
      row.animate([{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(14px)' }], { duration: 180, easing: 'ease-in' }).onfinish = () => row.remove();
      notify(`${name} removed from your demo schedule.`);
    });
  }
  $$('.cancel-booking').forEach(attachCancel);

  // Hydration tracker: increments to eight, then gives friendly feedback.
  let glasses = 4;
  $('#addWater').addEventListener('click', () => {
    if (glasses >= 8) {
      notify('Lovely work — you reached your water goal for today!');
      return;
    }
    glasses += 1;
    $('#waterCount').textContent = glasses;
    const glassesContainer = $('#waterGlasses');
    [...glassesContainer.children].forEach((glass, index) => glass.classList.toggle('filled', index < glasses));
    glassesContainer.setAttribute('aria-label', `${glasses} of 8 glasses logged`);
    notify(glasses === 8 ? 'Water goal complete. You did it!' : `Water logged: ${glasses} of 8 glasses. Keep sipping!`);
  });

  // Workout logging increments the goal and active minutes.
  let goal = 70;
  let activeMinutes = 85;
  let classCount = 8;
  $('#completeWorkout').addEventListener('click', () => {
    goal = Math.min(100, goal + 10);
    activeMinutes += 20;
    classCount = Math.min(12, classCount + 1);
    $('#goalPercent').textContent = `${goal}%`;
    $('#goalBar').style.width = `${goal}%`;
    $('.goal-progress').setAttribute('aria-valuenow', String(goal));
    $('#activeMinutes').textContent = activeMinutes;
    $('#classesCount').textContent = classCount;
    const day = $$('.goal-days span').find(el => !el.classList.contains('done'));
    if (day) day.classList.add('done');
    notify(goal >= 100 ? 'Weekly goal complete — celebrate your progress!' : 'Workout logged! 20 active minutes added. Keep blooming!');
  });

  // Workout category cards guide the user to relevant classes.
  const workoutFilters = {
    'Cardio': 'all',
    'Dance & Zumba': 'dance',
    'Yoga': 'yoga',
    'Strength training': 'strength',
    'Pilates': 'mindful',
    'Stretch & recovery': 'mindful'
  };
  $$('.workout-type').forEach(button => {
    button.addEventListener('click', () => {
      const category = workoutFilters[button.dataset.workout] || 'all';
      const filterButton = $(`.filter-chip[data-filter="${category}"]`);
      if (filterButton) filterButton.click();
      $('#classes').scrollIntoView({ behavior: 'smooth', block: 'start' });
      notify(`${button.dataset.workout} classes selected.`);
    });
  });

  // Mobile sidebar and backdrop.
  const sidebar = $('#sidebar');
  const overlay = document.createElement('div');
  overlay.className = 'menu-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  document.body.appendChild(overlay);
  function closeMenu() {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
    document.body.classList.remove('menu-open');
  }
  $('#menuToggle').addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    overlay.classList.toggle('show', open);
    document.body.classList.toggle('menu-open', open);
  });
  overlay.addEventListener('click', closeMenu);
  $$('.side-nav .nav-item').forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => { if (window.innerWidth > 991) closeMenu(); });

  $('#notificationButton').addEventListener('click', () => notify('You’re all caught up. Your next class is waiting for you!'));
  $('#profileButton').addEventListener('click', () => notify('Profile settings demo — connect your account system to enable editing.'));
})();

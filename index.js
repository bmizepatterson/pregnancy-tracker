const DateTime = luxon.DateTime;
const localStorageKey = 'pregnancy-tracker';
const PREGNANCY_LENGTH_DAYS = 280;

// State
let dueDate;
let tableData;
let popup;

function init() {
	const dueDateInput = document.getElementById('due-date-input');
	document.getElementById('form-due-date')
		.addEventListener('submit', e => {
			saveDueDate(dueDateInput.value);
			dueDate = DateTime.fromISO(dueDateInput.value);
			calculateTableData();
			updateTable();
			updateCalendar();
			e.preventDefault();
		});

	document.getElementById('btn-reset').addEventListener('click', reset);
	document.addEventListener('click', closeDayDetails);

	buildWeekNav();

	dueDateInput.value = getSavedData()?.dueDate ?? '';
	if (dueDateInput.value.length) {
		dueDate = DateTime.fromISO(dueDateInput.value);
		calculateTableData();
		updateTable();
		updateCalendar();
	}

	setTimeout(() => document.body.classList.add('show'));
}

function buildWeekNav() {
	const ul = document.getElementById('nav-weeks');
	for (let weekNo = 5; weekNo < 40; weekNo += 5) {
		const li = document.createElement('li');
		
		const a = document.createElement('a');
		a.setAttribute('data-nav', 'week-' + weekNo);
		a.classList.add('nav-link');
		a.textContent = nth(weekNo) + ' Week';

		li.appendChild(a);
		ul.appendChild(li);
	}

	document.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', scrollTo));
}

function getSavedData() {
	if (localStorage.getItem(localStorageKey)) {
		return JSON.parse(localStorage.getItem(localStorageKey));
	}
	return {};
}

function saveDueDate(dueDate) {
	if (!/\d{4}-\d{2}-\d{2}/.test(dueDate)) {
		throw new Error('Invalid due date');
	}

	const data = {
		...getSavedData(),
		dueDate
	};

	localStorage.setItem(localStorageKey, JSON.stringify(data));
}

function saveNote(dayGest, note) {
	if (dayGest == null) return;

	const data = getSavedData();
	if (data.notes == null) {
		data.notes = [];
	}
	const existingNote = data.notes.find(note => note.dayGest === dayGest);
	if (existingNote) {
		existingNote.note = note;
	} else {
		data.notes.push({ dayGest, note });
	}
	localStorage.setItem(localStorageKey, JSON.stringify(data));
}

function updateTable() {
	const today = DateTime.now();
	
	// Build the table
	const table = document.getElementById('table-tracker');
	const tbody = table.getElementsByTagName('tbody')[0];
	tbody.innerHTML = '';

	for (const record of tableData) {
		const row = document.createElement('tr');
		if (record.date.toLocaleString() === today.toLocaleString()) {
			row.classList.add('row-today');
			row.setAttribute('data-row-nav', 'today');
		} else if (record.date.toLocaleString() === dueDate.toLocaleString()) {
			row.classList.add('row-due-date');
			row.setAttribute('data-row-nav', 'due-date');
		} else {
			row.setAttribute('data-row-nav', 'week-' + record.weekNo);
		}
		if (record.weekNo % 2 === 0) {
			row.classList.add('row-shaded');
		}

		const dateCell = document.createElement('td');
		dateCell.textContent = record.date.toLocaleString({ month: 'short', day: 'numeric', weekday: 'short' });
		dateCell.classList.add('col-date');

		const weekNoCell = document.createElement('td');
		weekNoCell.textContent = nth(record.weekNo);
		weekNoCell.classList.add('col-week-no');

		const dayGestCell = document.createElement('td');
		dayGestCell.textContent = record.dayGest;
		dayGestCell.classList.add('col-day-gest');

		const dayFertCell = document.createElement('td');
		dayFertCell.textContent = record.dayFert;
		dayFertCell.classList.add('col-day-fert');

		const agePregCell = document.createElement('td');
		agePregCell.textContent = record.agePreg;
		agePregCell.classList.add('col-age-pregnancy');

		const ageConcCell = document.createElement('td');
		ageConcCell.textContent = record.ageConc;
		ageConcCell.classList.add('col-age-conceptus');

		const countdownCell = document.createElement('td');
		countdownCell.textContent = record.countdown;
		countdownCell.classList.add('col-countdown');

		const noteCell = document.createElement('td');
		noteCell.innerHTML = record.note ?? '';
		noteCell.classList.add('col-notes');
		noteCell.setAttribute('contentEditable', 'true');
		noteCell.addEventListener('blur', e => saveNote(record.dayGest, e.target.innerHTML));

		row.appendChild(dateCell);
		row.appendChild(weekNoCell);
		row.appendChild(dayGestCell);
		row.appendChild(dayFertCell);
		row.appendChild(agePregCell);
		row.appendChild(ageConcCell);
		row.appendChild(countdownCell);
		row.appendChild(noteCell);
		tbody.appendChild(row);
	}

	document.getElementById('main').classList.remove('empty');
}

function calculateTableData() {
	const savedData = getSavedData();

	// Calculate 40 weeks of gestation + one additional week
	tableData = [];
	for (let week = 0; week < 41; week++) {

		for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
			
			// Day of Gestation
			const dayGest = (week * 7) + dayOfWeek;

			// Countdown to Due Date
			const countdownDays = PREGNANCY_LENGTH_DAYS - dayGest;

			// Date
			const date = dueDate.minus({ days: countdownDays });

			// Week Number
			const weekNo = week + 1;

			// Day of Fertilization
			const dayFert = dayGest < 13 ? null : dayGest - 13;

			// Age of Pregnancy
			const agePregWeeks = Math.floor(dayGest / 7);
			const agePregDays = dayGest % 7;
			const agePreg = `${agePregWeeks} week${agePregWeeks === 1 ? '' : 's'}, ${agePregDays} day${agePregDays === 1 ? '' : 's'}`;

			// Age of Embryo/Fetus (Conceptus)
			const ageConcWeeks = Math.floor(dayFert / 7);
			const ageConcDays = dayFert % 7;
			const ageConc = dayFert == null 
				? null 
				: `${ageConcWeeks} week${ageConcWeeks === 1 ? '' : 's'}, ${ageConcDays} day${ageConcDays === 1 ? '' : 's'}`;

			const countdown = countdownDays < 1 ? null : countdownDays + (countdownDays === 1 ? ' day' : ' days');

			// Saved note
			let note = (savedData?.notes ?? []).find(note => note.dayGest === dayGest)?.note;
			if (!note) {
				if (agePregWeeks === 13 && agePregDays === 0) {
					note = '2nd Trimester Begins';
				} else if (agePregWeeks === 28 && agePregDays === 0) {
					note = '3rd Trimester Begins';
				}
			}

			tableData.push({
				date,
				weekNo,
				dayGest,
				dayFert,
				agePreg,
				ageConc,
				countdown,
				note,
			});
		}
	}
}

function updateCalendar() {
	const today = DateTime.now();
	const data = groupByMonth(tableData);
	console.log(data);

	const container = document.querySelector('[data-calendar]');
	container.innerHTML = '';

	for (const monthData of data) {
		const monthContainer = document.createElement('div');
		monthContainer.classList.add('month-container');

		// Month header
		const header = document.createElement('div');
		header.classList.add('month-header');
		header.textContent = monthData.month.toLocaleString({ month: 'long', year: 'numeric' });
		monthContainer.appendChild(header);

		// Month weekdays
		const weekdays = document.createElement('div');
		weekdays.classList.add('month-weekdays', 'grid-calendar');
		for (const weekdayStr of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
			const weekday = document.createElement('div');
			weekday.textContent = weekdayStr;
			weekdays.appendChild(weekday);
		}
		monthContainer.appendChild(weekdays);

		// Month calendar days
		const calendarDays = document.createElement('div');
		calendarDays.classList.add('month-days', 'grid-calendar');

		// Add padding days if the month doesn't start on Sunday
		for (let padding = 0; padding < monthData.days[0].date.weekday; padding++) {
			const paddingDay = document.createElement('div');
			calendarDays.appendChild(paddingDay);
		}

		// Actual days in the month
		for (const dayData of monthData.days) {
			const calendarDay = document.createElement('div');
			calendarDay.textContent = dayData.date.day;
			calendarDay.classList.add('calendar-day');
			
			if (dayData.dayGest != null) {
				calendarDay.classList.add('pregnancy-day');
				// calendarDay.setAttribute('data-calendar-day', dayData.dayGest);
				calendarDay.addEventListener('click', e => openDayDetails(dayData, e));
			}
			if (dayData.date.toLocaleString() === dueDate.toLocaleString()) {
				calendarDay.classList.add('due-date');
			}
			if (dayData.date.toLocaleString() === today.toLocaleString()) {
				calendarDay.classList.add('today');
			}
			if (dayData.note) {
				calendarDay.classList.add('has-note');
			}
			calendarDays.appendChild(calendarDay);
		}
		monthContainer.appendChild(calendarDays);

		container.appendChild(monthContainer);
	}
}

function groupByMonth(tableData) {
	const data = [];
	
	// Group into months
	for (const month of Array.from(new Set(tableData.map(tableRow => tableRow.date.month)))) {
		const days = tableData.filter(tableDatum => tableDatum.date.month === month);
		const firstDate = days[0].date;
		const lastDate = days[days.length - 1].date;

		// Include each day in the month, even if start date or due date are in the middle.
		if (firstDate.day !== 1) {
			for (let d = firstDate.day - 1; d > 0; d--) {
				days.unshift({
					date: firstDate.set({ day: d })
				});
			}
		}

		if (lastDate.day !== lastDate.daysInMonth) {
			for (let d = lastDate.day + 1; d <= lastDate.daysInMonth; d++) {
				days.push({
					date: lastDate.set({ day: d })
				});
			}
		}

		data.push({
			month: firstDate,
			days,
		});
	}

	return data;
}

function openDayDetails(dayData, e) {
	console.log(dayData);
	closeDayDetails();
	e.target.classList.add('active');
	e.stopPropagation();

	popup = document.createElement('div');
	popup.classList.add('popup');
	popup.addEventListener('click', e => e.stopPropagation());

	const heading = document.createElement('h4');
	heading.textContent = dayData.date.toLocaleString(DateTime.DATE_HUGE);
	popup.appendChild(heading);

	const lines = [
		`<strong>${nth(dayData.weekNo)}</strong> Week`,
		`<strong>${nth(dayData.dayGest)}</strong> Day of Gestation`,
		`Pregnancy is <strong>${dayData.agePreg}</strong> old`,
		`Conceptus is <strong>${dayData.ageConc}</strong> old`,
		dayData.countdown == null ? null : `<strong>${dayData.countdown}</strong> until due date`,
	];
	lines.filter(line => line != null).forEach(line => {
		const p = document.createElement('p');
		p.innerHTML = line;
		popup.appendChild(p);
	});

	// Note
	const note = document.createElement('div');
	note.classList.add('note');
	note.innerHTML = dayData.note ?? '';
	note.setAttribute('contentEditable', 'true');
	note.addEventListener('blur', e => {
		saveNote(dayData.dayGest, e.target.innerHTML);
		dayData.note = e.target.innerHTML;
		note.innerHTML = dayData.note ?? '';
	});
	popup.appendChild(note);

	const { top, left, width } = e.target.getBoundingClientRect();
	popup.style.left = left + width + 4 + 'px';
	popup.style.top = top + 'px';
	document.body.appendChild(popup);
}

function closeDayDetails() {
	document.querySelectorAll('.pregnancy-day').forEach(el => el.classList.remove('active'));
	popup?.remove();
}

function reset() {
	const input = document.getElementById('due-date-input');
	input.value = '';
	localStorage.removeItem(localStorageKey);
	const table = document.getElementById('table-tracker');
	table.getElementsByTagName('tbody')[0].innerHTML = '';
	document.getElementById('main').classList.add('empty');
	input.focus();
}

document.addEventListener('DOMContentLoaded', init);
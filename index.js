const DateTime = luxon.DateTime;
const localStorageKey = 'pregnancy-tracker';

function init() {
	const dueDateInput = document.getElementById('due-date-input');
	document.getElementById('form-due-date')
		.addEventListener('submit', (e) => {
			saveDueDate(dueDateInput.value);
			updateTable(dueDateInput.value);
			e.preventDefault();
		});

	document.getElementById('btn-reset').addEventListener('click', reset);

	buildWeekNav();
	document.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', scrollTo));

	dueDateInput.value = getSavedData()?.dueDate ?? '';
	if (dueDateInput.value.length) {
		updateTable(dueDateInput.value);
	}
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
}

function getSavedData() {
	return JSON.parse(localStorage.getItem(localStorageKey));
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

function updateTable(dueDateStr) {
	const dueDate = DateTime.fromISO(dueDateStr);
	const today = DateTime.now();
	const data = calculateTableData(dueDate);
	
	// Build the table
	const table = document.getElementById('table-tracker');
	const tbody = table.getElementsByTagName('tbody')[0];
	tbody.innerHTML = '';

	for (const record of data) {
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

function calculateTableData(dueDate) {
	const savedData = getSavedData();

	// Calculate 40 weeks of gestation + one additional week
	const tableData = [];
	for (let week = 0; week < 41; week++) {

		for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
			
			// Day of Gestation
			const dayGest = (week * 7) + dayOfWeek;

			// Countdown to Due Date
			const countdownDays = 280 - dayGest;

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

	return tableData;
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

// https://stackoverflow.com/a/31615643/6894436
function nth(n) {
	var s = ["th", "st", "nd", "rd"],
		v = n % 100;
	return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function scrollTo(e) {
	e.preventDefault();
	
	const theadHeight = document.querySelector('.table-tracker > thead').clientHeight;
	const navTarget = e.target.getAttribute('data-nav');
	
	const top = navTarget === 'top'
		? 0
		: document.querySelector(`[data-row-nav="${navTarget}"]`).getBoundingClientRect().top + window.scrollY - theadHeight;

	window.scroll({
		top,
		behavior: 'smooth',
	});
}

document.addEventListener('DOMContentLoaded', init);
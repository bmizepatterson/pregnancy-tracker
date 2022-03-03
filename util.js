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
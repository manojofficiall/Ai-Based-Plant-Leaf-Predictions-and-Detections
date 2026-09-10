// main.js
console.log('main.js loaded successfully.');

if (localStorage.getItem('isLoggedIn') === 'true') {
	document.querySelectorAll('a[href="login.html"]').forEach((loginLink) => {
		loginLink.href = 'dashboard.html';
	});
}

var Redux = require('redux'),
	React = require('react'),
	ReactDom = require('react-dom');

var counter = function (state, action) {
	if (typeof state === 'undefined') state = 0;

	switch (action.type) {
		case 'INCREMENT':
			return state + 1;
		case 'DECREMENT':
			return state - 1;
		default:
			return state;
	}
}

var store = Redux(counter);

var Counter = React.createClass({
	getInitialState : function () {
		return store.getState();
	},
	increment : function () {
		store.dispatch({ type : 'INCREMENT' });
	},
	decrement : function () {
		store.dispatch({ type : 'DECREMENT' });
	},
	render : function () {
		return (
			<div>
				<h2>{value}</h2>
				<button onClick="increment">+</button>
				<button onClick="decrement">-</button>
			</div>
		);
	}
});

var render = function () {
	ReactDom.render(
		<Counter/>,
		document.getElementById('root')
	);
};
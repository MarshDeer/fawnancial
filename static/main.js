// Initialize variables --------------------------------------------------------
let apiKey, updateInterval, cryptoExchange, targetSymbols, targetExchanges, colorBg, colorText, colorUp, colorDown, fontSize, cornerRadius, timer, tradingViewSettings, timerRemaining, listSymbols;



// Define custom elements ------------------------------------------------------
customElements.define(
	'ticker-element',
	class extends HTMLElement {
		constructor() {
			super();
			this.attachShadow({mode:'open'}).appendChild(
				templateTicker.content.cloneNode(true)
			);
		}
	}
);

customElements.define(
	'exchange-element',
	class extends HTMLElement {
		constructor() {
			super();
			this.attachShadow({mode:'open'}).appendChild(
				templateExchange.content.cloneNode(true)
			);
		}
	}
)

// Add event listeners ---------------------------------------------------------
buttonNewTicker.addEventListener('click', function openNewTicker() {
	inputAddTicker.value = '';
	inputAddTickerSearch.innerHTML = '';
	dialogNewTicker.showModal();
});

buttonNewExchange.addEventListener('click', function openNewExchange() {
	inputAddExchange.value = '';
	dialogNewExchange.showModal();
});

buttonConfirmNewExchange.addEventListener('click', function confirmExchange() {
	addExchange(inputAddExchange.value.toUpperCase());
	inputAddExchange.value = '';
	dialogNewExchange.close()
});

buttonShowSettings.addEventListener('click', function openSettings() {
	dialogSettings.showModal();
});

buttonSaveSettings.addEventListener('click', function saveSettings() {
	localStorage.setItem('apiKey', settingsKey.value);
	localStorage.setItem('cryptoExchange', settingsCrypto.value);
	
	localStorage.setItem('updateInterval', settingsInterval.value);
	clearInterval(timer);
	setInterval(updateData, settingsInterval.value * 1000);
	timerRemaining = settingsInterval.value;
	
	localStorage.setItem('colors', JSON.stringify([
		settingsColorBg.value,
		settingsColorText.value,
		settingsColorUp.value,
		settingsColorDown.value]));
	
	localStorage.setItem('fontSize', settingsFontSize.value)
	localStorage.setItem('cornerRadius', settingsRadius.value)
	
	getPreferences();
	buildSymbolsList();
	
	dialogSettings.close();
});

buttonResetSettings.addEventListener('click', function resetSettings() {
	localStorage.clear();
	location.reload(true);
});

buttonNewTickerStock.addEventListener('click', function newTickerStock() {
	addTicker(inputAddTicker.value.toUpperCase(), false);
	inputAddTicker.value = "";
	dialogNewTicker.close()
});

buttonNewTickerCrypto.addEventListener('click', function newTickerCrypto() {
	addTicker(inputAddTicker.value.toUpperCase(), true);
	inputAddTicker.value = "";
	dialogNewTicker.close()
});

buttonConfirmWelcome.addEventListener('click', function confirmWelcome() {
	apiKey = keyInput.value;
	localStorage.setItem('apiKey', apiKey);
	dialogWelcome.close();
	init();
});

buttonConfirmCrypto.addEventListener('click', function confirmCrypto() {
	cryptoExchange = inputCrypto.value;
	localStorage.setItem('cryptoExchange', cryptoExchange);
	dialogCrypto.close();
	init();
})

document.querySelectorAll('#buttonImport').forEach(button => {
	button.addEventListener('click', function importSettings() {
		let dummyInput = document.createElement('input');
		dummyInput.setAttribute('type', 'file');
		dummyInput.setAttribute('accepts', '.json');
		dummyInput.addEventListener('change', function() {
			let file = dummyInput.files[0];
			if (file) {
				let fileReader = new FileReader();
				fileReader.onload = function(e) {
					try {
						let data = JSON.parse(e.target.result);
						localStorage.clear();
						
						localStorage.setItem('apiKey', data['apiKey'] || null);
						localStorage.setItem('cryptoExchange', data['cryptoExchange'] || null);
						localStorage.setItem('colors', data['colors'] || null);
						localStorage.setItem('fontSize', data['fontSize'] || null);
						localStorage.setItem('updateInterval', data['updateInterval'] || null);
						localStorage.setItem('cornerRadius', data['cornerRadius'] || null);
						localStorage.setItem('targetSymbols', data['targetSymbols'] || null);
						localStorage.setItem('targetExchanges', data['targetExchanges'] || null);
						
						location.reload(true);
					} catch (error) {
						errorText = `Error parsing imported JSON: ${error}`;
						console.error(errorText);
						drawError(errorText);
					}
				}
				fileReader.readAsText(file);
			}
		});
		dummyInput.click();
		dummyInput.remove();
	});
});

buttonExport.addEventListener('click', function exportSettings() {
	let blob = new Blob([JSON.stringify(localStorage)], {type: 'application/json'})
	let dummyLink = document.createElement('a');
	dummyLink.href = URL.createObjectURL(blob);
	dummyLink.download = 'backup.json'
	dummyLink.click();
	dummyLink.remove();
});

document.querySelectorAll('dialog').forEach(dialog => {
	let buttonClose = document.createElement('button');
	buttonClose.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z" fill="var(--colorText)"/></svg>`;
	buttonClose.classList.add('buttonClose');
	buttonClose.setAttribute('aria-label', 'Close');
	buttonClose.addEventListener('click', function closeDialog() {
		dialog.close();
	});
	dialog.append(buttonClose);
})

inputAddTicker.addEventListener('input', function searchSymbol() {
	let queryString = inputAddTicker.value.toUpperCase()
	inputAddTickerSearch.innerHTML = '';
	if (queryString.length >= 3) {
		let listFiltered = listSymbols.filter(item => JSON.stringify(item).includes(queryString));
		listFiltered.forEach(item => {
			let itemOption = document.createElement('option');
			itemOption.value = item[1];
			itemOption.innerText = `${item[1]} | ${item[0]}`;
			inputAddTickerSearch.append(itemOption);
		})
	}
})

inputAddTickerSearch.addEventListener('mousedown', function selectSymbolFromSearch() {
	let symbolSelected = inputAddSymbolSearch.value;
	inputAddTicker.value = symbolSelected;
})

timerElement.addEventListener('click', function forceUpdate() {
	updateData();
	clearInterval(timer);
	setInterval(updateData, settingsInterval.value * 1000);
})

// Functions -------------------------------------------------------------------
function init() {
	getPreferences();
	populateCryptoExchanges();
	buildSymbolsList();
	
	if (apiKey == null) {
		dialogWelcome.showModal();
		return;
	}
	
	if (cryptoExchange == null) {
		dialogCrypto.showModal();
		return;
	}
	
	if (targetSymbols.length > 0) {
		targetSymbols.forEach(symbol => drawTicker(symbol));
	} else {
		dialogNewTicker.showModal();
	}
	
	targetExchanges.forEach(exchange => drawExchange(exchange));
	
	timer = setInterval(updateData, updateInterval * 1000)
	timerRemaining = updateInterval;
	setTimeout(updateCountdown, 1000)
	updateData();
}

function drawError(errorText) {
	let errorElement = document.createElement('article');
	errorElement.innerText = errorText;
	errorElement.classList.add('errorPopup')
	errorElement.addEventListener('click', function closeErrorPopup() {
		errorElement.remove();
	})
	
	areaErrors.append(errorElement);
	setTimeout(() => {errorElement.remove()}, 5000)
}

function getPreferences() {
	apiKey = localStorage.getItem('apiKey');
	settingsKey.value = apiKey;
	
	cryptoExchange = localStorage.getItem('cryptoExchange');
	
	updateInterval = localStorage.getItem('updateInterval') || 60;
	settingsInterval.value = updateInterval;
	
	targetSymbols = JSON.parse(localStorage.getItem('targetSymbols')) || [];
	targetExchanges = JSON.parse(localStorage.getItem('targetExchanges')) || [];
	
	let colors = JSON.parse(localStorage.getItem('colors'));
	if (colors == null) {
		colors = [
			'#000000',
			'#FFFFFF',
			'#00FF00',
			'#FF0000'];
		localStorage.setItem('colors', JSON.stringify(colors))
	}
	
	colorBg = colors[0];
	settingsColorBg.value = colorBg
	document.body.style.setProperty('--colorBg', colorBg);
	
	colorText = colors[1];
	settingsColorText.value = colorText
	document.body.style.setProperty('--colorText', colorText);
	
	colorUp = colors[2];
	settingsColorUp.value = colorUp
	document.body.style.setProperty('--colorUp', colorUp);
	
	colorDown = colors[3];
	settingsColorDown.value = colorDown
	document.body.style.setProperty('--colorDown', colorDown);
	
	fontSize = localStorage.getItem('fontSize') || 80;
	settingsFontSize.value = fontSize;
	document.body.style.setProperty('--fontSize', `${fontSize}px`);
	
	cornerRadius = localStorage.getItem('cornerRadius') || 5;
	settingsRadius.value = cornerRadius;
	document.body.style.setProperty('--cornerRadius', `${cornerRadius}px`);
}

function addTicker(symbol, isCrypto) {
	targetSymbols.push([symbol, isCrypto]);
	localStorage.setItem('targetSymbols', JSON.stringify(targetSymbols));
	drawTicker([symbol, isCrypto]);
	updateData();
}

function drawTicker(symbol) {
	let tickerContainer = document.createElement('article');
	tickerContainer.classList.add('tickerContainer')
	tickerContainer.addEventListener('click', function drawChart() {
		tradingViewContainer.innerHTML = '';
		
		tradingViewSettings = {
			autosize: true,
			symbol: symbol[0],
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			backgroundColor: colorBg,
			gridColor: `color-mix(in lab, ${colorBg} 80%, ${colorText})`,
			theme: 'dark',
			hide_legend: false,
			withdateranges: true,
			hide_side_toolbar: false,
			allow_symbol_change: false,
			save_image: false,
			container_id: 'tradingViewContainer'
		};
		// TODO: Proper TradingView widget styling
		
		try {
			tradingViewWidget = new TradingView.widget(tradingViewSettings);
			dialogChart.showModal();
		} catch (error) {
			let errorText = `Error initializing TradingView widget for "${symbol[0]}": ${error}`
			console.error(errorText);
			drawError(errorText);
		}
	});
	
	let tickerElement = document.createElement('ticker-element');
	tickerElement.dataset.symbol = symbol[1] ? `${cryptoExchange}:${symbol[0]}` : symbol[0];
	
	let changeArrow = document.createElement('div');
	changeArrow.classList.add('arrow');
	changeArrow.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="m 10.7138,4.20006 c 0.5826,-0.97101 1.9899,-0.97101 2.5725,0 L 21.4032,17.7282 C 22.0031,18.728 21.2829,20 20.117,20 H 3.88318 C 2.71724,20 1.99706,18.728 2.59694,17.7282 Z" fill="var(--colorText)"></svg>`;
	
	let slotName = document.createElement('span');
	slotName.slot = 'slotName';
	slotName.innerText = symbol[0];
	
	let slotPrice = document.createElement('span');
	slotPrice.slot = 'slotPrice';
	
	let slotChange = document.createElement('div');
	slotChange.slot = 'slotChange';
	slotChange.classList.add('change');
	slotChange.append(changeArrow.cloneNode(true), document.createElement('span'));
	
	let slotPercent = document.createElement('div');
	slotPercent.slot = 'slotChangePercent';
	slotPercent.classList.add('change');
	slotPercent.append(changeArrow.cloneNode(true), document.createElement('span'));
	
	tickerElement.append(slotName, slotPrice, slotChange, slotPercent);
	
	let buttonsContainer = document.createElement('section');
	buttonsContainer.classList.add('buttonsContainer');
	
	let buttonUp = document.createElement('button');
	buttonUp.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 7C12.2652 7 12.5196 7.10536 12.7071 7.29289L19.7071 14.2929C20.0976 14.6834 20.0976 15.3166 19.7071 15.7071C19.3166 16.0976 18.6834 16.0976 18.2929 15.7071L12 9.41421L5.70711 15.7071C5.31658 16.0976 4.68342 16.0976 4.29289 15.7071C3.90237 15.3166 3.90237 14.6834 4.29289 14.2929L11.2929 7.29289C11.4804 7.10536 11.7348 7 12 7Z" fill="var(--colorText)"/></svg>`;
	buttonUp.setAttribute('aria-label', 'Move Ticker Up');
	buttonUp.addEventListener('click', function tickerUp() {
		event.stopPropagation();
		index = targetSymbols.indexOf(symbol);
		if (index > 0) {
			targetSymbols.splice(index - 1, 0, targetSymbols.splice(index, 1)[0]);
			localStorage.setItem('targetSymbols', JSON.stringify(targetSymbols));
			areaTickers.insertBefore(tickerContainer, tickerContainer.previousSibling);
		}
	});
	
	let buttonClose = document.createElement('button');
	buttonClose.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z" fill="var(--colorText)"/></svg>`;
	buttonClose.setAttribute('aria-label', 'Remove Ticker');
	buttonClose.addEventListener('click', function tickerClose() {
		event.stopPropagation();
		targetSymbols.splice(targetSymbols.indexOf(symbol), 1);
		localStorage.setItem('targetSymbols', JSON.stringify(targetSymbols));
		tickerContainer.remove();
	});
	
	let buttonDown = document.createElement('button');
	buttonDown.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L12 14.5858L18.2929 8.29289C18.6834 7.90237 19.3166 7.90237 19.7071 8.29289C20.0976 8.68342 20.0976 9.31658 19.7071 9.70711L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289Z" fill="var(--colorText)"/></svg>`;
	buttonDown.setAttribute('aria-label', 'Move Ticker Down');
	buttonDown.addEventListener('click', function tickerDown(){
		event.stopPropagation();
		index = targetSymbols.indexOf(symbol);
		if (index < targetSymbols.length - 1) {
			targetSymbols.splice(index + 1, 0, targetSymbols.splice(index, 1)[0]);
			localStorage.setItem('targetSymbols', JSON.stringify(targetSymbols))
			areaTickers.insertBefore(tickerContainer.nextSibling, tickerContainer)
		}
	});
	
	buttonsContainer.append(buttonUp,buttonClose,buttonDown)
		
	tickerContainer.append(tickerElement, buttonsContainer);
	areaTickers.append(tickerContainer)
}

function addExchange(exchange) {
	targetExchanges.push(exchange);
	localStorage.setItem('targetExchanges', JSON.stringify(targetExchanges));
	drawExchange(exchange);
	updateData();
}

function drawExchange(exchange) {
	let exchangeContainer = document.createElement('article');
	exchangeContainer.classList.add('exchangeContainer');
		
	let exchangeElement = document.createElement('exchange-element')
	exchangeElement.dataset.exchange = exchange;
			
	let slotName = document.createElement('span');
	slotName.slot = 'slotName';
	slotName.innerText = exchange;
			
	let slotStatus = document.createElement('span');
	slotStatus.slot = 'slotStatus';
			
	exchangeElement.append(slotName, slotStatus);
		
	let buttonClose = document.createElement('button');
	buttonClose.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z" fill="var(--colorText)"/></svg>`;
	buttonClose.classList.add('buttonClose');
	buttonClose.setAttribute('aria-label', 'Remove Exchange');
	buttonClose.addEventListener('click', function exchangeClose() {
		targetExchanges.splice(targetExchanges.indexOf(exchange), 1);
		localStorage.setItem('targetExchanges', JSON.stringify(targetExchanges));
		exchangeContainer.remove();
	});
		
	exchangeContainer.append(exchangeElement, buttonClose);
	
	areaExchanges.append(exchangeContainer);
}

async function finnhubAPI(apiEndpoint, hasQuery) {
	let queryPrefix = hasQuery ? '&' : '?'
	let target = `https://finnhub.io/api/v1/${apiEndpoint}${queryPrefix}token=${apiKey}`
	try {
		let response = await fetch(target);
		
		if (!response.ok) {
			throw new Error(`HTTP error: ${response.status}`);
		} else {
			let data = await response.json();
			return data
		}
	} catch (error) {
		let errorText = `Error calling API endpoint "${apiEndpoint}"\n${error}`
		console.error(errorText)
		drawError(errorText)
		return null;
	}
}

async function buildSymbolsList() {
	listSymbols = [];
	let dataStock = await finnhubAPI(`stock/symbol?exchange=US`, true);
	if (dataStock) {
		dataStock.forEach(symbol => {
			listSymbols.push([symbol.description, symbol.symbol]);
		});
	}
	
	let dataCrypto = await finnhubAPI(`crypto/symbol?exchange=${cryptoExchange}`, true)
	if (dataCrypto) {
		dataCrypto.forEach(symbol => {
			let symbolSymbol = symbol.symbol.split(':')[1];
			let symbolName = symbol.description;
			listSymbols.push([symbolName, symbolSymbol])
		})
	}
}

async function populateCryptoExchanges() {
	let data = await finnhubAPI(`crypto/exchange`);
	if (data != null) {
		[inputCrypto, settingsCrypto].forEach(element => {
			data.forEach(exchange => {
				let option = document.createElement('option');
				option.value = exchange;
				option.innerText = exchange;
				
				element.append(option);
			})
		})
	} else {
		console.error(`Error fetching crypto exchanges`)
	}
	settingsCrypto.value = cryptoExchange;
}

function updateCountdown() {
	timerElement.innerText = `Next update in ${timerRemaining} seconds`;
	timerRemaining--;
	
	setTimeout(updateCountdown, 1000)
}

async function updateData() {
	timerRemaining = updateInterval;
	
	let tickerElements = Array.from(document.querySelectorAll('ticker-element'));
	let tickerPromises = tickerElements.map(async (ticker) => {
		let data = await finnhubAPI(`quote/?symbol=${ticker.dataset.symbol}`, true);
		let slotPrice = ticker.querySelector('[slot=slotPrice]')
		let slotChange = ticker.querySelector('[slot=slotChange] span');
		let slotChangePercent = ticker.querySelector('[slot=slotChangePercent] span');
		
		if (data && data.d != null) {
			let dataPrice = parseFloat(data.c.toFixed(2)).toLocaleString('en');
			let dataChange = parseFloat(data.d.toFixed(2)).toLocaleString('en');
			let dataChangePercent = parseFloat(data.dp.toFixed(2)).toLocaleString('en');
			let dataChangeDirection = dataPrice > 0 ? 'up' : 'down';
			
			slotPrice.innerText = dataPrice
			
			slotChange.innerText = dataChange;
			slotChange.parentNode.classList.remove('up', 'down');
			slotChange.parentNode.classList.add(dataChangeDirection)
			
			slotChangePercent.innerText = `${dataChangePercent}%`;
			slotChangePercent.parentNode.classList.remove('up', 'down');
			slotChangePercent.parentNode.classList.add(dataChangeDirection)
		} else {
			errorText = `No data found for symbol: ${ticker.dataset.symbol}`
			console.error(errorText);
			drawError(errorText);
			slotPrice.innerText = 'NO DATA';
			slotChange.innerText = '---';
			slotChangePercent.innerText = '---';
		}
	});
	await Promise.all(tickerPromises);
	
	let exchangeElements = Array.from(document.querySelectorAll('exchange-element'));
	let exchangePromises = exchangeElements.map(async (exchange) => {
		let data = await finnhubAPI(`stock/market-status?exchange=${exchange.dataset.exchange}`, true);
		let slotStatus = exchange.querySelector('[slot=slotStatus]');
		
		if (data != null) {
			let dataStatus = data.session;
			let dataColor = dataStatus != null ? 'up' : 'down';
			
			slotStatus.innerText = dataStatus != null ? dataStatus : 'Closed'
			slotStatus.classList.remove('up','down');
			slotStatus.classList.add(dataColor);
		} else {
			slotStatus.innerText = 'Error'
			console.error(`No data found for exchange: ${exchange.dataset.exchange}`);
		}
	});
	await Promise.all(exchangePromises)
}
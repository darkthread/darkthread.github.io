var afet;
(function (afet) {
	/**
	 * 簡易新手提示產生器 Ver 1.1.0 by Jeffrey https://blog.darkthread.net
	 * @param {any} guideCode 指示代碼，首次顯示後在localStorage下註記以免重複出現
	 * @param {boolean} force 無視 localStorage 已讀註記，一律顯示
	 * @param {any} instructions Key/Value 形式，Key為 Selector，Value 為說明物件
	 * @param {any} instrucStyles 說明區塊自訂樣式
	 * 說明物件格式為 { offsetTop: y, offsetLeft: x, text: '...', before: function(el) {...}, after: function(el) {...}  }
	 * 說明物件也可以字串取代，則說明會寫示在選取元素下方，說明文字以可為 HTML 或純文字，若為純文字支援換行顯示
	  */
	function showNoviceGuide(guideCode, force, instructions, instrucStyles) {
		var zIdx = 9990, bgColor = '#2196f3', key = "$NG_" + guideCode;
		if (localStorage.getItem(key) && !force) return;
		var docW = $(document).width() + 'px', docH = $(document).height() + 'px';
		var mask = $('<div></div>').css({
			position: 'absolute', top: 0, left: 0, width: docW, height: docH, 'z-index': zIdx,
			opacity: 0.2, 'background-color': '#444', cursor: 'pointer'
		});
		mask.appendTo('body');
		function getNumber(s) { return parseInt(s.replace('px', '')); }
		var queue = Object.keys(instructions);
		var curIdx = -1;
		function isLastSel() { return curIdx >= queue.length - 1; }
		function isFirstSel() { return curIdx <= 0; }
		function getNextSel() { 
			if (isLastSel()) return null;
			return queue[++curIdx];
		}
		function getPrevSel() {
			if (isFirstSel()) return null;
			return queue[--curIdx];
		}
		var lastTip, navBar;
		var svg = $('<svg version="1.1"></svg>').css({ position: 'absolute', top: 0, left: 0, zIndex: zIdx + 1, width: docW, height: docH, opacity: 0.5, cursor: 'pointer' });
		svg.appendTo('body');
		//http://chubao4ever.github.io/tech/2015/07/16/jquerys-append-not-working-with-svg-element.html
		function SVG(tag) {
			return document.createElementNS('http://www.w3.org/2000/svg', tag);
		}
		function drawLine(x1, y1, x2, y2, color) {
			$(SVG('line'))
				.attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2)
				.attr('stroke', color).attr('stroke-width', '2px')
				.appendTo(svg);
		}
		function drawCircle(x, y, r, color) {
			$(SVG('circle')).attr('cx', x).attr('cy', y).attr('r', r).attr('fill', color)
				.appendTo(svg);
		}
		function goTip(prev) {
			if (prev && isFirstSel()) return;
			if (lastTip) {
				 lastTip.trigger('next').remove();
				 lastTip = null;
			}
			navBar && navBar.remove();
			navBar = null;
			svg.empty();
			if (isLastSel() && !prev) {
				mask.remove();
				svg.remove();
				window.scrollTo(0, 0);
				localStorage.setItem(key, "Y");
				return;
			}
			var sel = prev ? getPrevSel() : getNextSel();
			var focusElem = $(sel);
			var instruction = instructions[sel];
			if (typeof instruction === "string") {
				instruction = {
					offsetTop: focusElem.height() + 20,
					offsetLeft: 0,
					text: instruction
				};
			}
			if (focusElem.length && focusElem.is(":visible")) {
				$.isFunction(instruction.before) && instruction.before(focusElem);
				var pos = focusElem.offset();
				var tip = $('<div></div>');
				tip.css({
					position: 'absolute',
					top: (pos.top + instruction.offsetTop) + 'px',
					left: (pos.left + instruction.offsetLeft) + 'px',
					"z-index": zIdx + 2,
					opacity: 1,
					backgroundColor: bgColor,
					padding: '6px',
					color: 'white'
				});
				if (instrucStyles) tip.css(instrucStyles);
				var instrText = instruction.text;
				if (instrText.indexOf('<') === 0)
					tip.html(instrText);
				else {
					tip.text(instrText);
					if (instrText.indexOf('\n') > -1)
						tip.html(tip.html().replace(/\n/g, '<br />'));
				}
				var s = getComputedStyle(focusElem[0]);
				tip.attr('data-st', (pos.left + getNumber(s.paddingLeft) + focusElem.width() / 2) + "," 
					+ (pos.top + getNumber(s.paddingTop) + focusElem.height() / 2));
				$.isFunction(instruction.after) && tip.bind("next", function() { 
					instruction.after(focusElem);
				});
			}
			else {
				//if not found, trigger click event to show next or prev tip
				setTimeout(function () { goTip(prev); }, 0);
				return;
			}
			lastTip = tip;
			lastTip.appendTo('body');		
			var pos = lastTip.offset();
			var st = lastTip.attr("data-st").split(',');
			drawCircle(st[0], st[1], 5, bgColor);
			drawLine(st[0], st[1], pos.left + lastTip.width() / 2, pos.top + lastTip.height() / 2, bgColor);
			var y = st[1] - $(document).scrollTop()
			console.log(y);
			if (y > $(window).height() / 2)	window.scrollTo(0, st[1]);
			else if (y < 30) window.scrollTo(0, 0);
			svg.hide().fadeIn('fast');
			lastTip.hide().fadeIn('fast', function() {
				//add navigation buttons
				navBar = $('<div class="novice-g"></div>');
				navBar.css({ 
					position: 'absolute', top: pos.top + lastTip.height() + 20, left: pos.left, 
					zIndex: zIdx + 2, width: lastTip.width() + 12, 
					textAlign: 'right', minWidth: '8em'
				});
				if (!isFirstSel()) navBar.append('<button class=prev title="上一則提示">←</button>');
				if (!isLastSel()) navBar.append('<button class=next title="下一則提示">→</button>');
				navBar.append('<button class=close title="結束導覽">ⅹ</button>');
				navBar.find('button')
				.css({ 
					padding: 0, width: '2em', height: '1.5em', lineHeight: '1.5em', 
					textAlign: 'center', marginLeft: '0.2em', opacity: 0.6,
					color: 'white', backgroundColor: '#888',
					border: 'none', textShadow: '1px 1px 1px #666'
				 })
				.click(function() {
					var b = $(this);
					if (b.hasClass('prev')) goTip(true);
					else if (b.hasClass('next')) goTip();
					else if (b.hasClass('close')) {
						curIdx = queue.length - 1;
						goTip();
					}
				});
				navBar.appendTo('body');
			});

		};
		svg.click(function() { goTip(false); });
		setTimeout(function () { svg.click(); }, 500);
	}
	afet.ShowNoviceGuide = showNoviceGuide;
})(afet || (afet = {}));
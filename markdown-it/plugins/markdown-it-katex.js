(function (global) {
    function escaped(src, pos) {
        let count = 0;
        while (pos > 0 && src[--pos] === '\\') count++;
        return count % 2 === 1;
    }

    function render(tex, displayMode, options) {
        try {
            return global.katex.renderToString(tex, Object.assign({
                displayMode,
                throwOnError: false
            }, options));
        } catch (err) {
            return '<span class="katex-error">' + tex + '</span>';
        }
    }

    function markdownitKatex(md, options) {
        md.inline.ruler.after('escape', 'math_inline', function (state, silent) {
            if (state.src[state.pos] !== '$' || state.src[state.pos + 1] === '$') return false;

            let pos = state.pos + 1;
            while ((pos = state.src.indexOf('$', pos)) !== -1) {
                if (!escaped(state.src, pos)) break;
                pos++;
            }

            if (pos === -1 || pos === state.pos + 1) return false;
            if (!silent) {
                const token = state.push('math_inline', 'math', 0);
                token.markup = '$';
                token.content = state.src.slice(state.pos + 1, pos);
            }
            state.pos = pos + 1;
            return true;
        });

        md.block.ruler.after('blockquote', 'math_block', function (state, startLine, endLine, silent) {
            let pos = state.bMarks[startLine] + state.tShift[startLine];
            let max = state.eMarks[startLine];
            if (state.src.slice(pos, pos + 2) !== '$$') return false;

            pos += 2;
            let firstLine = state.src.slice(pos, max);
            let lastLine = '';
            let nextLine = startLine;
            let found = false;

            if (firstLine.trim().endsWith('$$') && firstLine.trim().length > 2) {
                firstLine = firstLine.replace(/\s*\$\$$/, '');
                found = true;
            } else {
                while (++nextLine < endLine) {
                    pos = state.bMarks[nextLine] + state.tShift[nextLine];
                    max = state.eMarks[nextLine];
                    lastLine = state.src.slice(pos, max);
                    if (lastLine.trim().endsWith('$$')) {
                        lastLine = lastLine.replace(/\s*\$\$$/, '');
                        found = true;
                        break;
                    }
                }
            }

            if (!found) return false;
            if (silent) return true;

            const token = state.push('math_block', 'math', 0);
            token.block = true;
            token.markup = '$$';
            token.map = [startLine, nextLine + 1];
            token.content = firstLine + '\n' + state.getLines(startLine + 1, nextLine, state.tShift[startLine], true) + lastLine;
            state.line = nextLine + 1;
            return true;
        });

        md.renderer.rules.math_inline = (tokens, idx) => render(tokens[idx].content, false, options);
        md.renderer.rules.math_block = (tokens, idx) => render(tokens[idx].content, true, options) + '\n';
    }

    global.markdownitKatex = markdownitKatex;
})(window);

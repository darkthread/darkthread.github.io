using System.Numerics;
using System.Text.RegularExpressions;
BigInteger.Parse("0x1a3b5c7d9e", System.Globalization.NumberStyles.HexNumber);
args = args.Length == 0 ? new[] { "101010100000", "10111" } : args;

if (args.Length < 2)
{
    Console.WriteLine("Syntax: modulo-2-division <dividend> <divisor>");
    Console.WriteLine("Eaxmple: modulo-2-division 1010101 101");
    return;
}
var dividend = args[0];
var divisor = args[1];
var binDigChk = new Regex("^[01]+$");
var msgs = new List<string>();
if (!binDigChk.IsMatch(dividend))
    msgs.Add("dividend must be a binary number");
if (!binDigChk.IsMatch(divisor))
    msgs.Add("divisor must be a binary number");
if (msgs.Count > 0)
{
    Console.WriteLine(string.Join("\n", msgs));
    return;
}
var dividendLen = dividend.Length;
var divisorLen = divisor.Length;
var deltaLen = dividendLen - divisorLen;
msgs.Add(new string(' ', divisorLen) + "+" + new string('-', dividendLen));

// color red, yellow, green, cyan, magenta, blue    
var colorNums = new[] { 31, 33, 32, 36, 35, 34 };
var clrIdx = 0;
Func<int, char, string> colorText = (idx, text) => $"\u001b[{colorNums[idx % colorNums.Length]}m{text.ToString()}\u001b[0m";
Func<int, int, string, string> getPadding = (st, cnt, text) =>
    string.Join(string.Empty, Enumerable.Range(0, cnt).Select(o => colorText(st + o, text == null ? ':' : text[o])).ToArray());

msgs.Add($"{divisor}|{dividend.Substring(0, dividendLen - deltaLen)}{getPadding(0, deltaLen, dividend[divisorLen..])}");

var m = dividend.Substring(0, divisorLen);
var quotient = "";
var indent = new string(' ', divisorLen + 1);
Func<string, string, string> xor = (a, b) =>
    {
        if (a.Length != b.Length)
            throw new ArgumentException("a and b must be the same length");
        return new string(Enumerable.Range(0, a.Length)
            .Select(o => a[o] == b[o] ? '0' : '1').ToArray());
    };

for (var i = 0; i <= deltaLen; i++)
{
    var q = m[0] == '1' ? "1" : "0";
    var p = q == "1" ? divisor : new string('0', divisorLen);
    var remainder = xor(m, p)[1..];
    quotient += q;
    var padding = getPadding(i, deltaLen - i, null!);
    msgs.Add($"{indent}\x1b[38;5;21m{p[..1]}\x1b[0m{p[1..]}{padding}");
    msgs.Add($"{indent}{new string('-', divisorLen)}{padding}");
    indent += " ";
    m = remainder +
        (divisorLen + i < dividend.Length ? dividend.Substring(divisorLen + i, 1) : "");
    if (i < deltaLen)
        msgs.Add($"{indent}{m[..^1]}{colorText(clrIdx++, m[^1])}{getPadding(i + 1, deltaLen - i - 1, null!)}");
    else
        msgs.Add($"{indent}{m}");
}
msgs.Insert(0, $"{new string(' ', divisorLen * 2)}\x1b[38;5;21m{quotient}\x1b[0m");
Console.WriteLine(string.Join("\n", msgs));

function isPrime(num) {
    if (num <= 3) return num > 1;
    if ((num % 2 === 0) || (num % 3 === 0)) return false;
    let count = 5;
    while (Math.pow(count, 2) <= num) {
        if (num % count === 0 || num % (count + 2) === 0) return false;
        count += 6;
    }
    return true;
}
function listPrimes(maxNum) {
    let res = [];
    for (let i = 1; i <= maxNum; i++) {
        if (isPrime(i)) res.push(i);
    }
    return res;
}
self.addEventListener('message', function (e) {
    var res = listPrimes(e.data);
    console.log('done');
    self.postMessage(res);   
    self.close(); 
}, false);
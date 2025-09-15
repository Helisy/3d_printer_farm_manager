async function fetchInfo(url, method=undefined, callback=undefined){
	var info;
	await fetch(url, {
		method: !method ? "get" : method,
		headers: {"Content-type" : "application/json"},
	})
	.then((res) => {
		return res.json();
	})
	.then((data) => {
		info = data;
	}).catch(err => {
		info = [];
		if(!!callback){
			callback(data)
		}
	});
	return info;
}

async function postData(url, method, data, callback=undefined){
	var info;
	await fetch(url, {
		method: method,
		headers: {"Content-type" : "application/json"},
		body: JSON.stringify(data)
	})
	.then((res) => {
		return res.json();
	})
	.then((data) => {
		info = data;
		if(!!callback){
			callback(data)
		}
	}).catch(err => {

	});
	return info;
}
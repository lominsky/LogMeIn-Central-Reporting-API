var cid = '1234567890';
var psk = '1234567890qwertyuiopasdfghjklzxcvbnm';

var request = require('request');
var fs = require('fs');

var baseURL = 'https://secure.logmein.com/public-api/v1/';

var hosts = {"id": [], "name": []};
var hardwareToken;
var systemToken;

var hardwareReport;
var systemReport;

getHosts();

function getHosts() {
	console.log('Getting Current Hosts...');
	var hosts = {
	  url: baseURL + 'hosts',
	  headers: {
		'User-Agent': 'request',
		'Accept': 'application/JSON; charset=utf-8',
		'Authorization': '{\"companyId\": \"' + cid + '\", \"psk\": \"' + psk + '\"}'
	  }
	};
	request(hosts, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		var tempHosts = JSON.parse(body);
		parseHosts(tempHosts.hosts);
	  }
	  else if(response.statusCode == 429) {
		  console.log('Cannot retrieve host list due to high request volume, please try again in a few minutes.');
	  }
	  else
		  console.log('Error in function \'getHosts\'. Status Code ' + response.statusCode);
	});
}

function parseHosts(tempHosts) {
	console.log('Parsing Host IDs and Names...');
	var hostCount = tempHosts.length;
	for(var i = 0; i < hostCount; i++) {
		hosts.id.push(tempHosts[i].id);
		hosts.name.push(tempHosts[i].description);
	}
	retrieveHardwareToken();
}

function retrieveHardwareToken() {
	console.log('Retrieving New Hardware Token...');
	var hardware = {
	  url: baseURL + 'inventory/hardware/reports',
	  headers: {
		'Content-type': 'application/JSON; charset=utf-8',
		'Accept': 'application/JSON; charset=utf-8',
		'Authorization': '{\"companyId\": \"' + cid + '\", \"psk\": \"' + psk + '\"}'
	  },
	  body: '{\"hostIds\": [' + hosts.id + ']}'
	};
	
	request.post(hardware, function (error, response, body) {
	  	if(response.statusCode == 201 && !error) {
			hardwareToken = JSON.parse(body);
			console.log('Hardware Report Token Retrieved');
			generateHardwareReport();
		} else if (response.statusCode == 429) {
			console.log('Cannot generate new hardware token due to high request volume. Wait a few minutes and try again');
		} else
			console.log('Error in function \'retrieveHardwareToken\', Status Code: ' + response.statusCode);
	});
}

function generateHardwareReport() {
	console.log('Generating Hardware Report...');
	console.log('Hardware Token is: ' + hardwareToken.token);
	var hardware = {
	  url: baseURL + 'inventory/hardware/reports/' + hardwareToken.token,
	  headers: {
		'Accept': 'application/JSON; charset=utf-8',
		'Authorization': '{\"companyId\": \"' + cid + '\", \"psk\": \"' + psk + '\"}'
	  }
	};
	
	request.get(hardware, function (error, response, body) {
	  	if(response.statusCode == 200 && !error) {
			hardwareReport = JSON.parse(body);
			console.log('Hardware Report Stored');
			//console.log(hardwareReport);
			retrieveSystemToken();
		} else if (response.statusCode == 429) {
			console.log('Cannot generate hardware report due to high request volume. Wait a few minutes and try again');
		} else
			console.log('Error in function \'generateHardwareReport\', Status Code: ' + response.statusCode);
	});
}

function retrieveSystemToken() {
	console.log('Retrieving New System Token...');
	var system = {
	  url: baseURL + 'inventory/system/reports',
	  headers: {
		'Content-type': 'application/JSON; charset=utf-8',
		'Accept': 'application/JSON; charset=utf-8',
		'Authorization': '{\"companyId\": \"' + cid + '\", \"psk\": \"' + psk + '\"}'
	  },
	  body: '{\"hostIds\": [' + hosts.id + ']}'
	};
	
	request.post(system, function (error, response, body) {
	  	if(response.statusCode == 201 && !error) {
			systemToken = JSON.parse(body);
			console.log('System Report Token Retrieved');
			generateSystemReport();
		} else if (response.statusCode == 429) {
			console.log('Cannot generate new system token due to high request volume. Wait a few minutes and try again');
		} else
			console.log('Error in function \'retrieveSystemToken\', Status Code: ' + response.statusCode);
	});
}

function generateSystemReport() {
	console.log('Generating System Report...');
	console.log('System Token is: ' + systemToken.token);
	var system = {
	  url: baseURL + 'inventory/system/reports/' + systemToken.token,
	  headers: {
		'Accept': 'application/JSON; charset=utf-8',
		'Authorization': '{\"companyId\": \"' + cid + '\", \"psk\": \"' + psk + '\"}'
	  }
	};
	
	request.get(system, function (error, response, body) {
	  	if(response.statusCode == 200 && !error) {
			systemReport = JSON.parse(body);
			console.log('System Report Stored');
			printInformation();
		} else if (response.statusCode == 429) {
			console.log('Cannot generate system report due to high request volume. Wait a few minutes and try again');
		} else
			console.log('Error in function \'generateSystemReport\', Status Code: ' + response.statusCode);
	});
}

function printInformation() {
	var i = 0;
	console.log(hosts.id[i]);
	console.log(hosts.name[i]);
	console.log(hardwareReport.hosts[hosts.id[0]]);
	console.log(systemReport.hosts[hosts.id[0]]);
}
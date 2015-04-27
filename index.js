var cid = '123456789';
var psk = '123456789';

var request = require('request');
var fs = require('fs');
var readline = require('readline');
var colors = require('colors');

var baseURL = 'https://secure.logmein.com/public-api/v1/';

var hosts = {"id": [], "name": []};
var hardwareToken;
var systemToken;

var hardwareReports = [];
var systemReports = [];

getHosts();

function getHosts() {
	console.log('Getting Current Hosts...'.green);
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
		  console.log('Cannot retrieve host list due to high request volume. Wait a minute and try again.'.red);
	  }
	  else
		  console.log('Error in function \'getHosts\'. Status Code '.red + response.statusCode);
	});
}

function parseHosts(tempHosts) {
	console.log('Parsing Host IDs and Names...'.green);
	var hostCount = tempHosts.length;
	for(var i = 0; i < hostCount; i++) {
		hosts.id.push(tempHosts[i].id);
		hosts.name.push(tempHosts[i].description);
	}
	retrieveHardwareToken();
}

function retrieveHardwareToken() {
	console.log('Retrieving New Hardware Token...'.green);
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
			console.log('Hardware Report Token Retrieved'.green);
			generateHardwareReport();
		} else if (response.statusCode == 429) {
			console.log('Cannot generate new hardware token due to high request volume. Wait a minute and try again'.red);
		} else
			console.log('Error in function \'retrieveHardwareToken\', Status Code: '.red + response.statusCode);
	});
}

function generateHardwareReport() {
	console.log('Generating Hardware Report...'.green);
	console.log('Hardware Token is: '.green + hardwareToken.token);
	var hardware = {
	  url: baseURL + 'inventory/hardware/reports/' + hardwareToken.token,
	  headers: {
		'Accept': 'application/JSON; charset=utf-8',
		'Authorization': '{\"companyId\": \"' + cid + '\", \"psk\": \"' + psk + '\"}'
	  }
	};
	
	request.get(hardware, function (error, response, body) {
	  	if(response.statusCode == 200 && !error) {
			hardwareReports.push(JSON.parse(body));
			console.log('Hardware Report Stored'.green);
			//printInformation();
			
			//Get each additional 50 computers (still needs to be done for Hardware Reports
			if(JSON.parse(body).report.token == null)
				retrieveSystemToken();
			else{
				hardwareToken = JSON.parse(body).report;
				generateHardwareReport();
			}
		} else if (response.statusCode == 429) {
			console.log('Cannot generate hardware report due to high request volume. Wait a minute and try again'.red);
		} else
			console.log('Error in function \'generateHardwaremReport\', Status Code: '.red + response.statusCode);
	});
}

function retrieveSystemToken() {
	console.log('Retrieving New System Token...'.green);
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
			console.log('System Report Token Retrieved'.green);
			generateSystemReport();
		} else if (response.statusCode == 429) {
			console.log('Cannot generate new system token due to high request volume. Wait a minute and try again'.red);
		} else
			console.log('Error in function \'retrieveSystemToken\', Status Code: '.red + response.statusCode);
	});
}

function generateSystemReport() {
	console.log('Generating System Report...'.green);
	console.log('System Token is: '.green + systemToken.token);
	var system = {
	  url: baseURL + 'inventory/system/reports/' + systemToken.token,
	  headers: {
		'Accept': 'application/JSON; charset=utf-8',
		'Authorization': '{\"companyId\": \"' + cid + '\", \"psk\": \"' + psk + '\"}'
	  }
	};
	
	request.get(system, function (error, response, body) {
	  	if(response.statusCode == 200 && !error) {
			systemReports.push(JSON.parse(body));
			console.log('System Report Stored'.green);
			//printInformation();
			
			//Get each additional 50 computers (still needs to be done for Hardware Reports
			if(JSON.parse(body).report.token == null)
				userInput();
			else{
				systemToken = JSON.parse(body).report;
				generateSystemReport();
			}
		} else if (response.statusCode == 429) {
			console.log('Cannot generate system report due to high request volume. Wait a minute and try again'.red);
		} else
			console.log('Error in function \'generateSystemReport\', Status Code: '.red + response.statusCode);
	});
}

function userInput() {
	var rl = readline.createInterface({
	  input: process.stdin,
	  output: process.stdout
	});
	
	rl.question('Enter the computer name: ', function(compName) {
		rl.close();
		if(compName == 'exit' || compName == 'Exit')
			return console.log('Program Exiting');
		printInformation(compName);
	});
}

function printInformation(compID) {
	/*var index = -1;
	for(var i = 0; i < hosts.id.length; i++) {
		if(hosts.name[i].indexOf(compID) != -1) {
			index = i;
			break;
		}
	}
	if(index == -1)
		return userInput();*/
	//var array = [77998031, '77998031', "77998031"];
	//console.log(parseInt(compID/50));
	//console.log('Index: ' + compID);
	//console.log('Host Info: ' + hosts.id[compID] + ', ' + hosts.name[compID]);
	//console.log('Hardware Report: ' + hardwareReport[compID/50].hosts[hosts.id[compID]]);
	//console.log('System Report: ' + systemReports[parseInt(compID/50)].hosts[hosts.id[compID]].lastLogonUserName);
	fs.writeFile("userSystemReports.json", JSON.stringify(systemReports[parseInt(compID/50)].hosts[hosts.id[compID]]), function(err) {
		if(err) {
			return console.log(err);
		}

		console.log("The System Reports was saved!".blue);
	}); 
	fs.writeFile("userHardwareReports.json", JSON.stringify(hardwareReports[parseInt(compID/50)].hosts[hosts.id[compID]]), function(err) {
		if(err) {
			return console.log(err);
		}

		console.log("The Hardware Reports was saved!".blue);
			
		return userInput();
	}); 
}
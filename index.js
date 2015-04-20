var cid = '123456789';
var psk = '1234567890qwertyuiopasdfghjklzxcvbnm';

var request = require('request');
var fs = require('fs');
var d = require('./data.json')

var dBody = "";
var t = d.token;
var h = d.hosts;
var dBody = '{\"token\": {\"expires\":\"' + t.expires + '\","token\":\"' + +'\"}' + t.token + '\"}, \"hosts\": [' + h + '] }';

var hosts = [];
var hostsUpdated = false;

getHosts();
getToken();

function getToken() {
	var exp = new Date();
	exp.setFullYear(t.expires.substring(0,4));
	exp.setMonth(t.expires.substring(5,7));
	exp.setDate(t.expires.substring(8,10));
	exp.setHours(t.expires.substring(11,13));
	exp.setMinutes(t.expires.substring(14,16));
	exp.setSeconds(t.expires.substring(17,19));
	
	checkExpiration(exp);
}

function checkExpiration(exp) {
	var currentTime = new Date();
	var timeDiff = (exp.getTime()-currentTime.getTime());
	
	if(timeDiff > 0)
		console.log('Valid Token');
	else
		retrieveToken();
}

function getHosts() {
	var hosts = {
	  url: 'https://secure.logmein.com/public-api/v1/hosts',
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
		  console.log('Cannot retrieve host list due to high volume, using cached host information');
	  }
	  else
		  console.log('Error in function \'getHosts\', Status Code ' + response.statusCode);
	});
}

function parseHosts(tempHosts) {
	var hostCount = tempHosts.length;
	for(var i = 0; i < hostCount; i++) {
		hosts.push(tempHosts[i].id);
	}
	compareHosts();
}

function compareHosts() {
	if((hosts.length == d.hosts.length) && hosts.every(function(element, index) {
		return element === d.hosts[index]; 
	})) {
		console.log('Current Hostlist Matches Cache');
	}
	else {
		dBody = '{\"token\": {\"expires\":\"' + d.token.expires + '\","token\":\"' + d.token.token + '\"}, \"hosts\": [' + hosts + '] }';
		fs.writeFile('./data.json', dBody, function(err) {
			if(err) {
				return console.log('Error updated Data: Hosts');
			}
			return console.log('Data: Hosts Updated');
		});
		//retrieveToken();
	}
}

function retrieveToken() {
	var hardware = {
	  url: 'https://secure.logmein.com/public-api/v1/inventory/hardware/reports',
	  headers: {
		'Content-type': 'application/JSON; charset=utf-8',
		'Accept': 'application/JSON; charset=utf-8',
		'Authorization': '{\"companyId\": \"' + cid + '\", \"psk\": \"' + psk + '\"}'
	  },
	  body: '{\"hostIds\": [' + d.hosts + ']}'
	};
	
	
	request.post(hardware, function (error, response, body) {
	  	if(response.statusCode == 201 && !error) {
				dBody = '{\"token\": ' + body + ', \"hosts\": [' + d.hosts + '] }';
				fs.writeFile('./data.json', dBody, function(err) {
					if(err) {
						
						return console.log('Error updated Data: Token');
					}
					return console.log('Data: Token Updated');
				});
		}
		else
			console.log('Error in function \'retrieveToken\', Status Code: ' + response.statusCode);
	})
}
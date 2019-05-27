 // This file is empty.
 var express = require('express');
 var app = express();
 var serv = require('http').Server(app);
 
 
 var path = require('path');
 app.get('/',function(req,res){
	 res.sendFile(path.resolve(__dirname+'/../client/index.html'));
 });
 app.use('/client',express.static(__dirname+'/../client'));
 serv.listen(process.env.PORT || 1212);

var SOCKET_LIST = {};

var playerCount = 0;

var Entity = function(){
	//simple entity containing x and y coordinates, a unique identifier
	var self = {
		//init random position
		x:Math.floor(Math.random()*1000)+300,
		y:Math.floor(Math.random()*1000)+300,
		spdX:0,
		spdY:0,
		id:"",
	}
	//update the position based off speed
	self.update = function(){
		self.x += self.spdX;
		self.y += self.spdY;
		//boundaries
		if(self.x < 0)
			self.x = 0;
		if(self.x > 2000)
			self.x = 2000;
		if(self.y < 0)
			self.y = 0;
		if(self.y > 2000)
			self.y = 2000;
			
	}
	//returns distance between current entity and the passed in object
	self.getDistance = function(obj){
		return Math.sqrt(Math.pow(self.x-obj.x,2)+Math.pow(self.y-obj.y,2))
	}
	
	return self;
	
}

var Player = function(id){
	var self = Entity();

	self.id = id;
	self.number = playerCount;
	self.rb = false;
	self.lb = false;
	self.ub = false;
	self.db = false;
	self.maxSpd = 5;
	self.username = tempuser;
	
	var super_update = self.update;
	self.update = function(){
		//updates speed
		self.updateSpd();
		//updates position in entity
		super_update();
	}
	
	self.updateSpd = function(){
		if(self.rb){
			self.spdX = 5;
		}	
		if(self.lb){
			self.spdX = -5;
		}
		if(self.ub){
			self.spdY = -5;
		}
		if(self.db){
			self.spdY = 5;
		}
		
		if(self.ub == self.db){
			self.spdY = 0;
		}
		if(self.rb == self.lb){
			self.spdX = 0;
		}
		
		
		
	}
	self.getInitPack = function(){
		console.log("USERNAME IS "+self.username);
		return{
			id:self.id,
			x:self.x,
			y:self.y,
			number:self.number,
			username:self.username,
		};
	}
	self.getUpdatePack = function(){
		return{
			x:self.x,
			y:self.y,
			id:self.id,
			username:self.username,
		};
	}
	Player.list[id] = self;
	initPack.player.push(self.getInitPack());
	return self;
}
Player.list = {};

Player.onConnect = function(socket){
	var player = Player(socket.id);
	player.username = tempuser;
	console.log("PLAYER ON CONNECT USERNAME IS "+player.username);
	playerCount++;
	socket.on('keyPress',function(data){
		if(data.inputId==='a'){
			player.lb = data.state;
		}
		else if(data.inputId==='d'){
			player.rb = data.state;
		}
		else if(data.inputId==='w'){
			player.ub = data.state;
		}
		else if(data.inputId==='s'){
			player.db = data.state;
		}
	});
		
	socket.emit('init',{
		playerId:socket.id,
		player:Player.fullInit(),
		username:player.username,
	});
}

Player.fullInit = function(){
	var players = [];
	for(var i in Player.list){
		players.push(Player.list[i].getInitPack());
	}
	return players;
}

Player.onDisconnect = function(socket){
	delete Player.list[socket.id];
	deletePack.player.push(socket.id);
	playerCount--;
}

Player.update = function(){
	var pack=[];
	for(var i in Player.list){
		var player = Player.list[i];
		player.update();
		pack.push(player.getUpdatePack());
	}
	return pack;
}

var initPack = {player:[]};
var deletePack = {player:[]};

var io = require('socket.io')(serv,{});
var signedupUsers = {};
var tempuser = "";
io.sockets.on('connection',function(socket){
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;
	
	socket.on('signedin',function(data){
		console.log(data.username );
		tempuser = data.username;
		Player.onConnect(socket);
		
		console.log("TEMPUSER IS NOW "+tempuser);
		socket.emit('signinSuccess',{success:true});
	});
	
	socket.number = ""+Math.floor(10*Math.random());
	
	socket.on('disconnect',function(){
		delete SOCKET_LIST[socket.id];
		Player.onDisconnect(socket);
	});
	
	
});

setInterval(function(){
	var pack = {
		player:Player.update(),
		
	}
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('init',initPack);
		socket.emit('update',pack);
		socket.emit('delete',deletePack);
	}
	initPack.player = [];
	deletePack.player = [];

},1000/25);



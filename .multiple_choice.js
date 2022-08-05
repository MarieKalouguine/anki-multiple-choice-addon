if(void 0===window.Persistence){var _persistenceKey="github.com/SimonLammer/anki-persistence/",_defaultKey="_default";if(window.Persistence_sessionStorage=function(){var e=!1;try{"object"==typeof window.sessionStorage&&(e=!0,this.clear=function(){for(var e=0;e<sessionStorage.length;e++){var t=sessionStorage.key(e);0==t.indexOf(_persistenceKey)&&(sessionStorage.removeItem(t),e--)}},this.setItem=function(e,t){null==t&&(t=e,e=_defaultKey),sessionStorage.setItem(_persistenceKey+e,JSON.stringify(t))},this.getItem=function(e){return null==e&&(e=_defaultKey),JSON.parse(sessionStorage.getItem(_persistenceKey+e))},this.removeItem=function(e){null==e&&(e=_defaultKey),sessionStorage.removeItem(_persistenceKey+e)})}catch(e){}this.isAvailable=function(){return e}},window.Persistence_windowKey=function(e){var t=window[e],n=!1;"object"==typeof t&&(n=!0,this.clear=function(){t[_persistenceKey]={}},this.setItem=function(e,n){null==n&&(n=e,e=_defaultKey),t[_persistenceKey][e]=n},this.getItem=function(e){return null==e&&(e=_defaultKey),null==t[_persistenceKey][e]?null:t[_persistenceKey][e]},this.removeItem=function(e){null==e&&(e=_defaultKey),delete t[_persistenceKey][e]},null==t[_persistenceKey]&&this.clear()),this.isAvailable=function(){return n}},window.Persistence=new Persistence_sessionStorage,Persistence.isAvailable()||(window.Persistence=new Persistence_windowKey("py")),!Persistence.isAvailable()){var titleStartIndex=window.location.toString().indexOf("title"),titleContentIndex=window.location.toString().indexOf("main",titleStartIndex);titleStartIndex>0&&titleContentIndex>0&&titleContentIndex-titleStartIndex<10&&(window.Persistence=new Persistence_windowKey("qt"))}}

//--------------------------------------------------------------------------

var container = document.createElement('div');
var id = 0;
var correct_id = 0;

function StoreData () {
	if (Persistence.isAvailable()) {  // Check whether Persistence works on the client.
		let temp = `<input id="id" hidden value=${id}><input id="correct_id" hidden value=${correct_id}>${container.outerHTML}`; //<span id="id" hidden>${id}</span>
		//temp = "Hello Marie";
		Persistence.setItem(temp); // Retrieve the previously stored number and override the default.
	}
}

function answerClicked (clicked) {
	old_answer = document.getElementById(`${id}`).classList
	if(old_answer.contains("clicked")){
	 	old_answer.remove("clicked");
	}
	document.getElementById(`${clicked}`).classList.add("clicked");
	id = clicked;
	StoreData();
}

function playAudio(url) {
  new Audio(url).play();
}

function replaceAudio(url) {
	if (/Android/i.test(navigator.userAgent)) {
		return "<a class=\"replaybutton\" href=# onclick=\"playAudio('"+url+"'); return false;\"><span><svg viewBox=\"0 0 32 32\"><polygon points=\"11,25 25,16 11,7\"></polygon>Replay</svg></span></a>"
	}
	else{
		return "<a class=\"replay-button soundLink\" href=# onclick=\"playAudio('"+url+"'); return false;\"><svg class=\"playImage\" viewBox=\"0 0 64 64\" version=\"1.1\"><circle cx=\"32\" cy=\"32\" r=\"29\" /><path d=\"M56.502,32.301l-37.502,20.101l0.329,-40.804l37.173,20.703Z\" /></svg>\n</a>"
	}
}


function is_kept(item, fields){
	let keep = false;
	for (const f of fields){
		f2 = f.slice(1, -1).split(/~| ~ | ~|~ /);
		if (item[f2[0]].slice(0, 7)!="[sound:" && item[f2[0]]!=f2[1]){
			keep = true;
			break;
		}
	}
	return keep;
}

function CreateButtons (container, choiceHTML) {
	var mydata = JSON.stringify(mc_data);
// 	$('body').prepend(mydata);
	let search_terms = document.getElementById("search_terms").innerText.split('/');
	note_type = search_terms[0]
	deck_name = search_terms[1]
	
	let status = 'answer';
	let fields = choiceHTML.match(/\{([^\{\}]+)\}/g);
	field = fields[0].slice(1, -1).split(/~| ~ | ~|~ /);
	let items = mc_data[note_type][deck_name];
	items = items.filter((item) => is_kept(item, fields)); // remove current card
	items = items
	.map(x => ({ x, r: Math.random() }))
	.sort((a, b) => a.r - b.r)
	.map(a => a.x)
	.slice(0, nb_choices-1); // select random sample
	nb_choices_local = items.length+1
	console.log(nb_choices_local);
	correct_id = Math.floor(Math.random() * nb_choices_local);
	
	// Nested function :
	var replaceFields  = function (text) {
		field = text.slice(1, -1).split(/~| ~ | ~|~ /);
		if (i==correct_id){
			replacement=field[1]
		}
		else{
			replacement=items[i_item][field[0]]
		}
		if (replacement.slice(0, 7)=="[sound:"){
			replacement = replaceAudio(replacement.slice(7, -1))
		}
		return replacement;
	}
	var i_item = 0;
	for (var i = 0; i < nb_choices_local; i++) {
		let localHTML = choiceHTML.replace(/\{([^\{\}]+)\}/g, replaceFields);
		container.innerHTML += `<div><button id="${i}" class="${status}" onclick="answerClicked(${i});">${localHTML}</button></div>`;
		if (i!=correct_id){i_item ++;}
	}
	return correct_id;
}

var choice = document.getElementById("choice");
if (choice)
{
	choiceHTML = choice.outerHTML;
	choice.insertAdjacentElement('afterend', container);
	var correct_id = CreateButtons(container, choice.outerHTML);
	id = correct_id;
	StoreData();
	choice.style.display = 'none';
}

var choice_correct = document.getElementById("choice_correct");
if (choice_correct)
{
	
	choice_correct.insertAdjacentElement('afterend', container);
	if (Persistence.isAvailable()) {  // Check whether Persistence works on the client.
		container.outerHTML = Persistence.getItem();
		Persistence.clear();            // Clear the storage
	}
	id = document.getElementById("id").value;
	correct_id = document.getElementById("correct_id").value;
	
	let ec = document.getElementById(`${correct_id}`);
	let e = document.getElementById(`${id}`);
	e.id = "chosen";

	if (id!=correct_id) {
		e.outerHTML = e.outerHTML.replace("answer", "wrong");
	}
	ec.innerHTML = choice_correct.outerHTML;
	ec.outerHTML = ec.outerHTML.replace("answer", "correct");
 	choice_correct.style.display = 'none';
	$('#qa :button').prop('disabled', true); // Disable all the buttons

}

$('body').prepend(`<style>@import url(".style_button.css")</style>`);

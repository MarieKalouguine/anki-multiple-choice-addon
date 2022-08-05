# import the main window object (mw) from aqt
from aqt import mw
# import the "show info" tool from utils.py
from aqt.utils import showInfo, qconnect
# import all of the Qt GUI library
from aqt.qt import *
from aqt import gui_hooks
import json
from bs4 import BeautifulSoup
import re
import shutil, os



def serializeConfig(config):
	return "var nb_choices = {};\n".format(config["nb_choices"])

def parse_card(card):
	soup = BeautifulSoup(card.template()["qfmt"], features="html.parser")
	choice = soup.find(id='choice')
	if choice:	# if it is a multi-choice card (container with id="choice" found)
		note_type = card.note_type()["name"]
		card_deck = mw.col.decks.get(card.current_deck_id())["name"]
		return re.findall(r'\{([^\{\}]+)\}', str(choice))	# find multi-choice fields
	return []

class MainClass:
	def __init__(self):
		self.config_string = serializeConfig( mw.addonManager.getConfig(__name__))
	
	def add_entry(self, note_id):
		note = mw.col.get_note(note_id)
		note_type = note.note_type()["name"]
		cards = note.cards()
		entry = {"id" : note.id}
		valid = False
		for card in cards:
			fields = parse_card(card)
			if fields!=[]:
				valid = True
				card_deck = mw.col.decks.get(card.current_deck_id())["name"]
				if not self.mydict.__contains__(note_type):
					self.mydict[note_type] = {}
				if not self.mydict[note_type].__contains__(card_deck):
					self.mydict[note_type][card_deck] = []
				for string in fields:
					field = re.split('~| ~ | ~|~ ', string)[0]
					entry[field] = note[field]
		if valid:
			self.mydict[note_type][card_deck].append(entry)
		
	def mainFunction(self) -> None:
		self.mydict = {}
		note_ids = mw.col.find_notes("") # find all notes
		for note_id in note_ids:
			self.add_entry(note_id)
		
		# Serializing dict
		self.dict_string = "var mc_data = "+json.dumps(self.mydict, separators=(',', ': '), ensure_ascii=False)+";"
		self.writeMedia()

	def writeMedia(self):
		addon_path = os.path.dirname(os.path.realpath(__file__))
		media_path = os.path.splitext(mw.col.path)[0]+".media"
		js_object = self.config_string+self.dict_string
		# Writing dictionary to a string variable in a JS file
		with open(os.path.join(media_path, ".mc_data.js"), 'w') as f:
			f.write(js_object)
		# write basic stylesheet for the buttons if it does not exist yet
		if not os.path.isfile(os.path.join(media_path, ".style_button.css")):
			shutil.copy(os.path.join(addon_path, ".style_button.css"), media_path)
		if not os.path.isfile(os.path.join(media_path, ".multiple_choice.js")):
			shutil.copy(os.path.join(addon_path, ".multiple_choice.js"), media_path)

	def myOptionsFunc(self, config):
		self.config_string = serializeConfig(config)
		self.writeMedia()

mainObject = MainClass()
mw.addonManager.setConfigUpdatedAction(__name__, mainObject.myOptionsFunc)

# create a new menu item
action = QAction("Generate multi-choice database", mw)
# set it to call mainFunction when it's clicked
qconnect(action.triggered, mainObject.mainFunction)
# and add it to the tools menu
mw.form.menuTools.addAction(action)
# add hook that will call this function every time there is a sync in preparation
gui_hooks.sync_will_start.append(mainObject.mainFunction)

# Makefile
#
# Copyright © 2012-2014 Richard Thomas Harrison (Tricky)
#
# This work is licensed under the Creative Commons License
# Attribution-Noncommercial-Share Alike 4.0 International (CC BY-NC-SA 4.0)
#
# To view a copy of this license, visit
# http://creativecommons.org/licenses/by-nc-sa/4.0/ or send an email
# to info@creativecommons.org
#
# Makefile for Zoom Camera OXP.

ifndef HOME
	HOME = /home/$(USERNAME)
endif

SHELL = /bin/sh
CP = $(shell which cp) -a
RM = $(shell which rm) -f
MV = $(shell which mv)
MD = $(shell which mkdir)
ZIP = $(shell which zip)
BZR = /usr/bin/bzr
EXPORT = $(BZR) export

BASEDIR = $(HOME)/.Oolite/OXPs
GAMESDIR = $(HOME)/Games
OOLITEDIR = $(GAMESDIR)/Oolite

ifndef V176
	V176 = 0
endif
ifndef V177
	V177 = 1
endif
ifndef V180
	V180 = 1
endif

ifeq ($(V176),1)
	OOLITE176 = v1.76.1
endif
ifeq ($(V177),1)
	OOLITE177 = v1.77/Deployment v1.77/Development
endif
ifeq ($(V180),1)
	OOLITE180 = v1.80/Deployment v1.80/Development
endif

ifndef TAG
	TAG = trunk
endif

DEVELNAME = Zoom
DEVEL_OXP = $(TAG)/$(DEVELNAME).oxp

ifeq ($(realpath $(DEVEL_OXP)/manifest.plist),)
	_OXZCOMPAT = 0
	_VER = $(strip $(shell sed -n 's/^.* this\.version = \"\(.*\)\";$$/\1/p' $(DEVEL_OXP)/Scripts/zoom-camera.js))
else
	_OXZCOMPAT = 1
	IDENTIFIER = $(strip $(shell sed -n 's/^.* identifier = \"\(.*\)\";$$/\1/p' $(DEVEL_OXP)/manifest.plist))
	_VER = $(strip $(shell sed -n 's/^.* version = \"\(.*\)\";$$/\1/p' $(DEVEL_OXP)/manifest.plist))
endif

ifeq ($(V180),0)
	_OXZCOMPAT = 0
endif

ifndef VER
	VER = $(_VER)
	VERREV = $(strip $(shell echo $(VER)r`$(BZR) revno`))
else ifneq ($(VER),$(_VER))
	TAG = tags/$(VER)
	VERREV = $(strip $(shell echo $(VER)r`$(BZR) revno -rtag:$(VER)`))
else
	VERREV = $(strip $(shell echo $(VER)r`$(BZR) revno`))
endif

ifeq ($(realpath $(TAG)),)
	TAG = trunk
	VER = $(_VER)
	VERREV = $(strip $(shell echo $(VER)r`$(BZR) revno`))
endif

ifeq ($(TAG),trunk)
	DEVEL_BASENAME = $(DEVELNAME).oxp
else
	DEVEL_BASENAME = $(DEVELNAME)_$(VER).oxp
endif

OXP = $(OXPNAME)_$(VER).oxp

ifeq ($(_OXZCOMPAT),1)
	OXZ = $(IDENTIFIER).oxz
endif

OOLITEDIRS =

ifeq ($(V176),1)
	OOLITEDIRS += $(OOLITE176)
endif
ifeq ($(V177),1)
	OOLITEDIRS += $(OOLITE177)
endif
ifeq ($(V180),1)
	ifeq ($(_OXZCOMPAT),0)
		OOLITEDIRS += $(OOLITE180)
	endif
endif

ADDONDIRS = $(patsubst %,$(OOLITEDIR)/%/AddOns,$(OOLITEDIRS))
OXPDIRS = $(patsubst %,%/Tricky.oxp/$(OXP),$(ADDONDIRS))

ifeq ($(V180),1)
	ifeq ($(_OXZCOMPAT),1)
		MANAGEDADDONS = oolite.app/GNUstep/Library/ApplicationSupport/Oolite/ManagedAddOns
		OXZADDONDIRS = $(patsubst %,$(OOLITEDIR)/%/$(MANAGEDADDONS),$(OOLITE180))
		OXZPATH = $(patsubst %,%/$(IDENTIFIER).oxz,$(OXZADDONDIRS))
	endif
endif

.PHONY: default all test zoom clean reallyclean

default: zoom

all: zoom

zoom: $(BASEDIR)/$(OXPNAME)_$(VER) touch-export makearchive $(OXPDIRS) $(OXZPATH)
fake-zoom: fake-export touch-export makearchive $(OXPDIRS) $(OXZPATH)

test:
	@echo "TAG:             \`$(TAG)'"
	@echo "VER:             \`$(VER)'"
	@echo "VERREV:          \`$(VERREV)'"
	@echo "OXPNAME:         \`$(OXPNAME)'"
	@echo "DEVEL_BASENAME:  \`$(DEVEL_BASENAME)'"
	@echo "DEVEL_OXP:       \`$(DEVEL_OXP)'"
	@echo "OXP:             \`$(OXP)'"
	@echo "OXPDIRS:         \`$(OXPDIRS)'"
ifeq ($(_OXZCOMPAT),1)
    @echo "IDENTIFIER:      \`$(IDENTIFIER)'"
	@echo "OXZ:             \`$(OXZ)'"
	@echo "OXZPATH:         \`$(OXZPATH)'"
endif

test-release: test clean fake-zoom

release: clean zoom

$(GAMESDIR)/%/$(OXP):
	$(MD) -p $@
	$(CP) -t $@ $(BASEDIR)/$(OXPNAME)_$(VER)/$(OXP)/*

$(OOLITEDIR)/%/$(OXZ):
ifeq ($(_OXZCOMPAT),1)
	$(CP) -L $(BASEDIR)/$(OXPNAME)_$(VER).oxz $@
endif

$(BASEDIR)/$(OXPNAME)_$(VER):
	$(EXPORT) $@ $(TAG)
	$(MV) $@/$(DEVEL_BASENAME) $@/$(OXP)

fake-export:
	$(MD) -p $(BASEDIR)/$(OXPNAME)_$(VER)
	$(CP) $(TAG)/* $(BASEDIR)/$(OXPNAME)_$(VER)
	cd $(BASEDIR)/$(OXPNAME)_$(VER) && $(MV) $(DEVEL_BASENAME) x$(OXP)
	cd $(BASEDIR)/$(OXPNAME)_$(VER) && $(MV) x$(OXP) $(OXP)

touch-export:
	$(BASEDIR)/touch_export.sh $(TAG) $(DEVELNAME) $(OXPNAME) $(VER)

tag: tags/$(VER)

tags/$(VER):
	$(MD) -p $@
	$(CP) trunk/* $@
	cd $@ && $(MV) $(DEVELNAME).oxp $(DEVELNAME)_$(VER).oxp

makezip:
	cd $(BASEDIR) && $(ZIP) -q9or $(OXPNAME)_$(VERREV).zip $(OXPNAME)_$(VER)
	cd $(BASEDIR) && $(ZIP) -T $(OXPNAME)_$(VERREV).zip
	cd $(BASEDIR) && ln -sf $(OXPNAME)_$(VERREV).zip $(OXPNAME)_$(VER).zip

cleanzip:
	$(RM) $(BASEDIR)/$(OXPNAME)_$(VERREV).zip
	$(RM) $(BASEDIR)/$(OXPNAME)_$(VER).zip

makeoxz:
ifeq ($(_OXZCOMPAT),1)
	cd $(BASEDIR)/$(OXPNAME)_$(VER)/$(OXP) && $(ZIP) -q9or $(OXPNAME)_$(VERREV).oxz .
	cd $(BASEDIR) && $(MV) $(OXPNAME)_$(VER)/$(OXP)/$(OXPNAME)_$(VERREV).oxz .
	cd $(BASEDIR) && $(ZIP) -T $(OXPNAME)_$(VERREV).oxz
	cd $(BASEDIR) && ln -sf $(OXPNAME)_$(VERREV).oxz $(OXPNAME)_$(VER).oxz
endif

cleanoxz:
ifeq ($(_OXZCOMPAT),1)
	$(RM) $(BASEDIR)/$(OXPNAME)_$(VERREV).oxz
	$(RM) $(BASEDIR)/$(OXPNAME)_$(VER).oxz
endif

makearchive: makezip makeoxz

clean-oxp:
	$(RM) -r $(BASEDIR)/$(OXPNAME)_$(VER) $(OXPDIRS)
	$(RM) -r $(OXPDIRS)
ifeq ($(_OXZCOMPAT),1)
	$(RM) $(OXZPATH)
endif

clean: cleanzip cleanoxz clean-oxp

reallyclean: clean

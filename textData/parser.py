#!/usr/bin/env python

# Copyright (c) 2018 Stanford University
#
# Permission to use, copy, modify, and distribute this software for any
# purpose with or without fee is hereby granted, provided that the above
# copyright notice and this permission notice appear in all copies.
#
# THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR(S) DISCLAIM ALL WARRANTIES
# WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
# MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL AUTHORS BE LIABLE FOR
# ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
# WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
# ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
# OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

"""
Scan the time trace data in a log file; find all records containing
a given string, and output only those records, renormalized in time
so that the first record is at time 0.
Usage: ttgrep.py string file
"""

from __future__ import division, print_function
from glob import glob
from optparse import OptionParser
import math
import os
import re
import string
import sys
import numpy as np
import json

def scanProjectCards(f):
    """
    Scan the project card file given by 'f' (handle for an open file)
    """
    cardList = []
    card = {}
    step = 0
    jsonStr = ""
    for line in f:
        if line == '\n':
            # print("Parsed data!")
            # print(card)
            # Do more jobs...?
            cardList.append(card)
            card = {}
            step = 0
            continue
        
        
        if step == 0:
            # match = re.match('([0-9.]+):(?:\*)? (.+)\s+', line)
            match = re.match('(\w+):(?:\*)? (.+)\s+', line)
            if not match:
                print("Step: " + str(step) + " Can't parse! " + line)
            # card["number"] = int(match.group(1))
            card["number"] = match.group(1)
            card["title"] = match.group(2).strip()
            step += 1
            continue
        if step == 1:
            # match tags
            match = re.match('(Earth|Jovian|Space|Event|City|Building|Power|Science|Plant|Animal|Microbe) tag.*', line)
            if not match:
                step += 1
            else:
                tagTexts = [x.strip() for x in line.split(',')]
                assert(len(tagTexts) > 0)
                tags = {
                    "Earth": 0, "Jovian": 0, "Space": 0, "Event": 0, "City": 0, "Building": 0, "Power": 0, "Science": 0, "Plant": 0, "Animal": 0, "Microbe": 0
                }
                for tagText in tagTexts:
                    matchTag = re.match('(Earth|Jovian|Space|Event|City|Building|Power|Science|Plant|Animal|Microbe) tag', tagText)
                    if not matchTag:
                        print("Can't parse tag text! line: " + line + ", tagText: " + tagText)
                    tags[matchTag.group(1)] += 1
                card["tag"] = tags
                step += 1
                continue
        if step == 2:    
            match = re.match('Cost: ([0-9.]+)\s+', line)
            if not match:
                assert(card["number"][0] == 'P')
                step += 1
                # print("Step: " + str(step) + " Can't parse! " + line)
            else:
                card["cost"] = int(match.group(1))
                step += 1
                continue
        if step == 3:
            match = re.match('Requires: (.+)\s+', line)
            if not match:
                step += 1
                #print("Step: " + str(step) + " Can't parse! " + line)
            else:
                card["require"] = match.group(1)
                #TODO: parse the requirement.
                step += 1
                continue
        if step == 4:
            # Actions
            matchEndAction = re.match('--(-)+\s+', line)
            if matchEndAction:
                step += 1
                continue
            if "action" in card:
                card["action"] += line
            else:
                card["action"] = line
            continue
        if step == 5:
            # Promotion outcome. e.g, inrease MC production rate
            #TODO: check "OR ~~".
            matchVP = re.match('VP: (.+)\s+', line)
            matchProduction = re.match('(Decrease|Increase|Reduce) (M\$|Steel|Titanium|Plant|Energy|Power|Heat)\s*([0-9]*)\.?\s+', line)
            matchProduction2 = re.match('(Decrease|Increase|Reduce) ([0-9]+) (M\$|Steel|Titanium|Plant|Energy|Power|Heat)\.?\s+', line)
            matchTerraforming = re.match('(?:(?:TempUp|Ocean Tile|O2|TR)\s+)+', line)
            matchResource = re.match('(Lose|Gain|M\$|Titanium|Plant|Steel|Energy|Heat).*\s+', line)
            matchResource2 = re.match('([\-?0-9]+) (M\$|Titanium|Plant|Steel|Energy|Heat)\s+', line)
            matchComment = re.match('(\(.+\))\s+', line)
            
            #TODO: implement handlers for the following matches.
            matchAnyProd = re.match('(Decrease|Increase|Reduce) any-(M\$|Steel|Titanium|Plant|Energy|Heat)', line)
            matchStealRes = re.match('STEAL any-(M\$|Steel|Titanium|Plant|Energy|Heat)', line)
            matchRemoveRes = re.match('Remove any-(M\$|Steel|Titanium|Plant|Energy|Heat) ([0-9]*)', line)
            
            
            if matchVP:
                matchNumVP = re.match('VP: (-?[0-9.]+)\s+', line)
                if matchNumVP:
                    card["VP"] = int(matchNumVP.group(1))
                else:
                    card["VP_complex"] = matchVP.group(1)
            elif matchProduction:
                changeAmount = 1
                if matchProduction.group(3) != "":
                    changeAmount = int(matchProduction.group(3))
                if matchProduction.group(1) == "Decrease" or matchProduction.group(1) == "Reduce":
                    changeAmount *= -1
                if "production" not in card:
                    card["production"] = {}
                resType = matchProduction.group(2)
                if resType == "Power":
                    resType = "Energy"
                card["production"][resType] = changeAmount
            elif matchProduction2:
                changeAmount = int(matchProduction2.group(2))
                if matchProduction2.group(1) == "Decrease" or matchProduction2.group(1) == "Reduce":
                    changeAmount *= -1
                if "production" not in card:
                    card["production"] = {}
                resType = matchProduction2.group(3)
                if resType == "Power":
                    resType = "Energy"
                card["production"][resType] = changeAmount
            elif matchTerraforming:
                remaining = line
                count = 0
                terraformingType = ""
                while True:
                    matchTerraformingText = re.match('(TempUp|Ocean Tile|O2|TR).*', remaining)
                    if not matchTerraformingText:
                        break
                    remaining = remaining[len(matchTerraformingText.group(1)):].strip()
                    # print("match: " + matchTerraformingText.group(1) + " Remaining: " + remaining)
                    assert(matchTerraformingText.group(1) == line[:len(matchTerraformingText.group(1))])
                    terraformingType = matchTerraformingText.group(1)
                    count += 1
                assert(count > 0)
                assert(len(terraformingType) > 0)
                if "terraforming" not in card:
                    card["terraforming"] = {}
                card["terraforming"][terraformingType] = count
            elif matchResource:
                # print(line)
                remaining = line
                sign = 1
                if matchResource.group(1) == "Gain":
                    sign = 1
                    remaining = remaining[len(matchResource.group(1)):].strip()
                elif matchResource.group(1) == "Lose":
                    sign = -1
                    remaining = remaining[len(matchResource.group(1)):].strip()
                
                count = 0
                explicitCount = False
                resType = ""
                while True:
                    resText = re.match('(M\$|Titanium|Plant|Steel|Energy|Heat).*', remaining)
                    countText = re.match('([0-9]+).*', remaining)
                    if resText:
                        if not explicitCount:
                            count += 1
                        assert(resType == "" or resType == resText.group(1))
                        resType = resText.group(1)
                        remaining = remaining[len(resText.group(1)):].strip()
                    elif countText:
                        count = int(countText.group(1))
                        explicitCount = True
                        remaining = remaining[len(countText.group(1)):].strip()
                    else:
                        break
                if len(remaining) > 0: #e.g., Microbe*, Animal*
                    if "outcome" in card:
                        card["outcome"] += line
                    else:
                        card["outcome"] = line
                    continue
                assert(len(resType) > 0)
                assert(count > 0)
                
                if "resource" not in card:
                    card["resource"] = {}
                card["resource"][resType] = sign * count
                # print(card["resource"])
            elif matchResource2:
                count = int(matchResource2.group(1))
                resType = matchResource2.group(2)
                if "resource" not in card:
                    card["resource"] = {}
                card["resource"][resType] = count
            elif matchComment:
                card["outcome_comment"] = matchComment.group(1)
            else:
                if "outcome" in card:
                    card["outcome"] += line
                else:
                    card["outcome"] = line
            continue
    jsonStr = json.dumps(cardList)
    return jsonStr


if len(sys.argv) != 2:
    print("Usage: %s outputFile" % (sys.argv[0]))
    sys.exit(1)

print(scanProjectCards(open(sys.argv[1])))

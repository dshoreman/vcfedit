# vCard Editor

Run `npx http-server` in the source dir and head to localhost:8080.

## Features / Todo

### Card Board
* [x] Create empty vCard file
* [x] Load existing vCards from file
* [x] Remove unused cards from the board

### vCards
* [ ] Add new contact
* [x] Show contact summaries
  * [ ] Expand to show all properties
* [x] Export and download VCF file
  * [ ] Format as latest/custom version of vCard format
* [x] Rearrange contacts in the cards
* [x] Drag and drop to move contacts between vCards
  * [ ] Hold shift/alt to create a copy instead
* [ ] Remove contacts

### Contacts
* [ ] Editable properties
* [ ] Sort contacts by name
* [ ] Remove properties from a contact
* [x] Side by side compare/merge
  * [x] Manually choose properties to move
  * [x] Auto-position properties in new contact
  * [ ] Edit property values before saving
  * [x] Operate on temporary copies to allow reverting
  * [ ] Auto-remove contacts when there's no properties left
  * [x] Update contacts in card board after merging

## Known Bugs

* Exported VCF files don't reflect the visible order of contacts

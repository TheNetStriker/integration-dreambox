import { UiItem, UiPage } from "@unfoldedcircle/integration-api";

const MAIN_PAGE: UiPage =
{
  "page_id": "main",
  "name": "Main Menu",
  "grid": { "width": 4, "height": 6 },
  "items": [
    {
      "command": {
        "cmd_id": "INFO"
      },
      "location": {
        "x": 0,
        "y": 0
      },
      "size": {
        "height": 2,
        "width": 2
      },
      "type": "icon",
      "icon": "uc:square-info"
    },
    {
      "command": {
        "cmd_id": "HELP"
      },
      "location": {
        "x": 2,
        "y": 0
      },
      "size": {
        "height": 2,
        "width": 2
      },
      "type": "icon",
      "icon": "uc:square-question"
    },
    {
      "command": {
        "cmd_id": "DOWNMIX_ON"
      },
      "location": {
        "x": 0,
        "y": 2
      },
      "size": {
        "height": 2,
        "width": 2
      },
      "type": "text",
      "text": "Downmix ON"
    },
    {
      "command": {
        "cmd_id": "DOWNMIX_OFF"
      },
      "location": {
        "x": 2,
        "y": 2
      },
      "size": {
        "height": 2,
        "width": 2
      },
      "type": "text",
      "text": "Downmix OFF"
    },
    {
      "command": {
        "cmd_id": "TV"
      },
      
      "location": {
        "x": 0,
        "y": 4
      },
      "size": {
        "height": 1,
        "width": 1
      },
      "type": "icon",
      "icon": "uc:tv"
    },
    {
      "command": {
        "cmd_id": "RADIO"
      },
      "location": {
        "x": 1,
        "y": 4
      },
      "size": {
        "height": 1,
        "width": 1
      },
      "type": "icon",
      "icon": "uc:radio"
    },
    {
      "command": {
        "cmd_id": "TEXT"
      },
      "location": {
        "x": 2,
        "y": 4
      },
      "size": {
        "height": 1,
        "width": 1
      },
      "type": "icon",
      "icon": "uc:message-text"
    },
    {
      "command": {
        "cmd_id": "VIDEO"
      },
      "location": {
        "x": 3,
        "y": 4
      },
      "size": {
        "height": 1,
        "width": 1
      },
      "type": "icon",
      "icon": "uc:file-video"
    },
    {
      "command": {
        "cmd_id": "RED"
      },
      "location": {
        "x": 0,
        "y": 5
      },
      "size": {
        "height": 1,
        "width": 1
      },
      "type": "icon",
      "icon": "custom:red-dot.png"
    },
    {
      "command": {
        "cmd_id": "GREEN"
      },
      "location": {
        "x": 1,
        "y": 5
      },
      "size": {
        "height": 1,
        "width": 1
      },
      "type": "icon",
      "icon": "custom:green-dot.png"
    },
    {
      "command": {
        "cmd_id": "YELLOW"
      },
      "location": {
        "x": 2,
        "y": 5
      },
      "size": {
        "height": 1,
        "width": 1
      },
      "type": "icon",
      "icon": "custom:yellow-dot.png"
    },
    {
      "command": {
        "cmd_id": "BLUE"
      },
      "location": {
        "x": 3,
        "y": 5
      },
      "size": {
        "height": 1,
        "width": 1
      },
      "type": "icon",
      "icon": "custom:blue-dot.png"
    }
  ],
  add(item: UiItem): void {
    this.items.push(item);
  }
}

const KEYPAD_PAGE: UiPage = {
  "page_id": "keypad",
  "name": "Keypad",
  "grid": { "width": 3, "height": 4 },
  "items": [
    {
      "type": "text",
      "text": "1",
      "command": {
        "cmd_id": "1"
      },
      "location": { "x": 0, "y": 0 },
      "size": { "width": 1, "height": 1 }
    },
    {
      "type": "text",
      "text": "2",
      "command": {
        "cmd_id": "2"
      },
      "location": { "x": 1, "y": 0 },
      "size": { "width": 1, "height": 1 }
    },
    {
      "type": "text",
      "text": "3",
      "command": {
        "cmd_id": "3"
      },
      "location": { "x": 2, "y": 0 },
      "size": { "width": 1, "height": 1 }
    },
    {
      "type": "text",
      "text": "4",
      "command": {
        "cmd_id": "4"
      },
      "location": { "x": 0, "y": 1 },
      "size": { "width": 1, "height": 1 }
    },
    {
      "type": "text",
      "text": "5",
      "command": {
        "cmd_id": "5"
      },
      "location": { "x": 1, "y": 1 },
      "size": { "width": 1, "height": 1 }
    },
    {
      "type": "text",
      "text": "6",
      "command": {
        "cmd_id": "6"
      },
      "location": { "x": 2, "y": 1 },
      "size": { "width": 1, "height": 1 }
    },
    {
      "type": "text",
      "text": "7",
      "command": {
        "cmd_id": "7"
      },
      "location": { "x": 0, "y": 2 },
      "size": { "width": 1, "height": 1 }
    },
    {
      "type": "text",
      "text": "8",
      "command": {
        "cmd_id": "8"
      },
      "location": { "x": 1, "y": 2 },
      "size": { "width": 1, "height": 1 }
    },
    {
      "type": "text",
      "text": "9",
      "command": {
        "cmd_id": "9"
      },
      "location": { "x": 2, "y": 2 },
      "size": { "width": 1, "height": 1 }
    },
    {
      "type": "text",
      "text": "<",
      "command": {
        "cmd_id": "PREVIOUS"
      },
      "location": { "x": 0, "y": 3 },
      "size": { "width": 1, "height": 1 }
    },
    {
      "type": "text",
      "text": "0",
      "command": {
        "cmd_id": "0"
      },
      "location": { "x": 1, "y": 3 },
      "size": { "width": 1, "height": 1 }
    },
    {
      "type": "text",
      "text": ">",
      "command": {
        "cmd_id": "NEXT"
      },
      "location": { "x": 2, "y": 3 },
      "size": { "width": 1, "height": 1 }
    }
  ],
  add(item: UiItem): void {
    this.items.push(item);
  }
}

export { MAIN_PAGE, KEYPAD_PAGE };
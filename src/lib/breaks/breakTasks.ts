export interface BreakTask {
  id: string
  text: string
  emoji: string
  durationSecs: number
}

export const BREAK_TASKS: BreakTask[] = [
  { id: 'breathing',   text: 'Take 10 slow, deep breaths',            emoji: '🌬️', durationSecs: 60  },
  { id: 'jumping',     text: 'Do 10 jumping jacks',                   emoji: '🏃', durationSecs: 45  },
  { id: 'window',      text: 'Walk to a window and look outside',     emoji: '🌳', durationSecs: 60  },
  { id: 'water',       text: 'Get a glass of water and drink it',     emoji: '💧', durationSecs: 60  },
  { id: 'stretch',     text: 'Stretch your arms up high 5 times',     emoji: '🙆', durationSecs: 30  },
  { id: 'neck',        text: 'Roll your neck slowly 5 times each way',emoji: '🔄', durationSecs: 45  },
  { id: 'walk',        text: 'Walk around the room 3 times',          emoji: '🚶', durationSecs: 60  },
  { id: 'dance',       text: 'Have a 30-second dance break!',         emoji: '💃', durationSecs: 30  },
  { id: 'eyes',        text: 'Close your eyes and rest them',         emoji: '👀', durationSecs: 30  },
  { id: 'squeeze',     text: 'Squeeze your hands into fists, release',emoji: '✊', durationSecs: 30  },
]

export function getRandomTask(): BreakTask {
  return BREAK_TASKS[Math.floor(Math.random() * BREAK_TASKS.length)]
}

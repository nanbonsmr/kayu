export interface StickerItem {
  id:    string;
  emoji: string;
  label: string;
}

export interface StickerPack {
  id:       string;
  name:     string;
  icon:     string;
  premium:  boolean; // requires Pro subscription
  stickers: StickerItem[];
}

export const STICKER_PACKS: StickerPack[] = [

  // ── FREE ──────────────────────────────────────────────────────────────────
  {
    id: 'essentials', name: 'Essentials', icon: '⭐', premium: false,
    stickers: [
      { id: 'fire',      emoji: '🔥', label: 'Fire'      },
      { id: 'star',      emoji: '⭐', label: 'Star'      },
      { id: 'sparkles',  emoji: '✨', label: 'Sparkles'  },
      { id: 'heart',     emoji: '❤️', label: 'Heart'     },
      { id: 'crown',     emoji: '👑', label: 'Crown'     },
      { id: 'diamond',   emoji: '💎', label: 'Diamond'   },
      { id: 'lightning', emoji: '⚡', label: 'Lightning' },
      { id: 'rainbow',   emoji: '🌈', label: 'Rainbow'   },
      { id: 'sun',       emoji: '☀️', label: 'Sun'       },
      { id: 'moon',      emoji: '🌙', label: 'Moon'      },
      { id: 'flower',    emoji: '🌸', label: 'Flower'    },
      { id: 'butterfly', emoji: '🦋', label: 'Butterfly' },
      { id: 'star2',     emoji: '🌟', label: 'Glow Star' },
      { id: 'boom',      emoji: '💥', label: 'Boom'      },
      { id: 'hundred',   emoji: '💯', label: '100'       },
      { id: 'trophy',    emoji: '🏆', label: 'Trophy'    },
    ],
  },
  {
    id: 'faces', name: 'Faces', icon: '😊', premium: false,
    stickers: [
      { id: 'smile',  emoji: '😊', label: 'Smile'  },
      { id: 'cool',   emoji: '😎', label: 'Cool'   },
      { id: 'love',   emoji: '😍', label: 'Love'   },
      { id: 'laugh',  emoji: '😂', label: 'Laugh'  },
      { id: 'wink',   emoji: '😉', label: 'Wink'   },
      { id: 'kiss',   emoji: '😘', label: 'Kiss'   },
      { id: 'think',  emoji: '🤔', label: 'Think'  },
      { id: 'wow',    emoji: '😮', label: 'Wow'    },
      { id: 'cry',    emoji: '😭', label: 'Cry'    },
      { id: 'angry',  emoji: '😤', label: 'Angry'  },
      { id: 'devil',  emoji: '😈', label: 'Devil'  },
      { id: 'angel',  emoji: '😇', label: 'Angel'  },
      { id: 'nerd',   emoji: '🤓', label: 'Nerd'   },
      { id: 'clown',  emoji: '🤡', label: 'Clown'  },
      { id: 'alien',  emoji: '👽', label: 'Alien'  },
      { id: 'robot',  emoji: '🤖', label: 'Robot'  },
      { id: 'ghost',  emoji: '👻', label: 'Ghost'  },
      { id: 'skull',  emoji: '💀', label: 'Skull'  },
    ],
  },
  {
    id: 'nature', name: 'Nature', icon: '🌿', premium: false,
    stickers: [
      { id: 'tree',      emoji: '🌲', label: 'Tree'      },
      { id: 'palm',      emoji: '🌴', label: 'Palm'      },
      { id: 'cactus',    emoji: '🌵', label: 'Cactus'    },
      { id: 'wave',      emoji: '🌊', label: 'Wave'      },
      { id: 'mountain',  emoji: '⛰️', label: 'Mountain'  },
      { id: 'leaf',      emoji: '🍃', label: 'Leaf'      },
      { id: 'maple',     emoji: '🍁', label: 'Maple'     },
      { id: 'snowflake', emoji: '❄️', label: 'Snowflake' },
      { id: 'cloud',     emoji: '☁️', label: 'Cloud'     },
      { id: 'rose',      emoji: '🌹', label: 'Rose'      },
      { id: 'earth',     emoji: '🌍', label: 'Earth'     },
      { id: 'comet',     emoji: '☄️', label: 'Comet'     },
    ],
  },

  // ── PRO ───────────────────────────────────────────────────────────────────
  {
    id: 'love', name: 'Love', icon: '💕', premium: true,
    stickers: [
      { id: 'red-heart',    emoji: '❤️', label: 'Red Heart'    },
      { id: 'pink-heart',   emoji: '🩷', label: 'Pink Heart'   },
      { id: 'orange-heart', emoji: '🧡', label: 'Orange Heart' },
      { id: 'yellow-heart', emoji: '💛', label: 'Yellow Heart' },
      { id: 'green-heart',  emoji: '💚', label: 'Green Heart'  },
      { id: 'blue-heart',   emoji: '💙', label: 'Blue Heart'   },
      { id: 'purple-heart', emoji: '💜', label: 'Purple Heart' },
      { id: 'black-heart',  emoji: '🖤', label: 'Black Heart'  },
      { id: 'white-heart',  emoji: '🤍', label: 'White Heart'  },
      { id: 'broken-heart', emoji: '💔', label: 'Broken'       },
      { id: 'two-hearts',   emoji: '💕', label: 'Two Hearts'   },
      { id: 'sparkling',    emoji: '💖', label: 'Sparkling'    },
      { id: 'growing',      emoji: '💗', label: 'Growing'      },
      { id: 'revolving',    emoji: '💞', label: 'Revolving'    },
      { id: 'ribbon',       emoji: '💝', label: 'Ribbon'       },
      { id: 'cupid',        emoji: '💘', label: 'Cupid'        },
    ],
  },
  {
    id: 'celebration', name: 'Party', icon: '🎉', premium: true,
    stickers: [
      { id: 'party',     emoji: '🎉', label: 'Party'      },
      { id: 'confetti',  emoji: '🎊', label: 'Confetti'   },
      { id: 'balloon',   emoji: '🎈', label: 'Balloon'    },
      { id: 'cake',      emoji: '🎂', label: 'Cake'       },
      { id: 'gift',      emoji: '🎁', label: 'Gift'       },
      { id: 'champagne', emoji: '🥂', label: 'Cheers'     },
      { id: 'fireworks', emoji: '🎆', label: 'Fireworks'  },
      { id: 'sparkler',  emoji: '🎇', label: 'Sparkler'   },
      { id: 'medal',     emoji: '🥇', label: 'Gold Medal' },
      { id: 'ribbon2',   emoji: '🎀', label: 'Ribbon'     },
      { id: 'clap',      emoji: '👏', label: 'Clap'       },
    ],
  },
  {
    id: 'animals', name: 'Animals', icon: '🐾', premium: true,
    stickers: [
      { id: 'cat',     emoji: '🐱', label: 'Cat'     },
      { id: 'dog',     emoji: '🐶', label: 'Dog'     },
      { id: 'fox',     emoji: '🦊', label: 'Fox'     },
      { id: 'bear',    emoji: '🐻', label: 'Bear'    },
      { id: 'panda',   emoji: '🐼', label: 'Panda'   },
      { id: 'koala',   emoji: '🐨', label: 'Koala'   },
      { id: 'lion',    emoji: '🦁', label: 'Lion'    },
      { id: 'tiger',   emoji: '🐯', label: 'Tiger'   },
      { id: 'unicorn', emoji: '🦄', label: 'Unicorn' },
      { id: 'dragon',  emoji: '🐉', label: 'Dragon'  },
      { id: 'penguin', emoji: '🐧', label: 'Penguin' },
      { id: 'owl',     emoji: '🦉', label: 'Owl'     },
      { id: 'parrot',  emoji: '🦜', label: 'Parrot'  },
      { id: 'shark',   emoji: '🦈', label: 'Shark'   },
      { id: 'octopus', emoji: '🐙', label: 'Octopus' },
      { id: 'frog',    emoji: '🐸', label: 'Frog'    },
    ],
  },
  {
    id: 'food', name: 'Food', icon: '🍕', premium: true,
    stickers: [
      { id: 'pizza',      emoji: '🍕', label: 'Pizza'      },
      { id: 'burger',     emoji: '🍔', label: 'Burger'     },
      { id: 'taco',       emoji: '🌮', label: 'Taco'       },
      { id: 'sushi',      emoji: '🍣', label: 'Sushi'      },
      { id: 'ramen',      emoji: '🍜', label: 'Ramen'      },
      { id: 'donut',      emoji: '🍩', label: 'Donut'      },
      { id: 'icecream',   emoji: '🍦', label: 'Ice Cream'  },
      { id: 'coffee',     emoji: '☕', label: 'Coffee'     },
      { id: 'boba',       emoji: '🧋', label: 'Boba'       },
      { id: 'cocktail',   emoji: '🍹', label: 'Cocktail'   },
      { id: 'avocado',    emoji: '🥑', label: 'Avocado'    },
      { id: 'strawberry', emoji: '🍓', label: 'Strawberry' },
    ],
  },
  {
    id: 'travel', name: 'Travel', icon: '✈️', premium: true,
    stickers: [
      { id: 'plane',   emoji: '✈️', label: 'Plane'   },
      { id: 'rocket',  emoji: '🚀', label: 'Rocket'  },
      { id: 'car',     emoji: '🚗', label: 'Car'     },
      { id: 'ship',    emoji: '🚢', label: 'Ship'    },
      { id: 'map',     emoji: '🗺️', label: 'Map'     },
      { id: 'compass', emoji: '🧭', label: 'Compass' },
      { id: 'beach',   emoji: '🏖️', label: 'Beach'   },
      { id: 'camping', emoji: '🏕️', label: 'Camping' },
      { id: 'city',    emoji: '🌆', label: 'City'    },
      { id: 'eiffel',  emoji: '🗼', label: 'Eiffel'  },
      { id: 'globe',   emoji: '🌐', label: 'Globe'   },
    ],
  },
  {
    id: 'sports', name: 'Sports', icon: '⚽', premium: true,
    stickers: [
      { id: 'soccer',     emoji: '⚽', label: 'Soccer'     },
      { id: 'basketball', emoji: '🏀', label: 'Basketball' },
      { id: 'football',   emoji: '🏈', label: 'Football'   },
      { id: 'tennis',     emoji: '🎾', label: 'Tennis'     },
      { id: 'boxing',     emoji: '🥊', label: 'Boxing'     },
      { id: 'skateboard', emoji: '🛹', label: 'Skate'      },
      { id: 'surf',       emoji: '🏄', label: 'Surf'       },
      { id: 'gym',        emoji: '🏋️', label: 'Gym'        },
      { id: 'yoga',       emoji: '🧘', label: 'Yoga'       },
      { id: 'dance',      emoji: '💃', label: 'Dance'      },
      { id: 'medal2',     emoji: '🏅', label: 'Medal'      },
    ],
  },
  {
    id: 'music', name: 'Music', icon: '🎵', premium: true,
    stickers: [
      { id: 'music-note',  emoji: '🎵', label: 'Note'       },
      { id: 'music-notes', emoji: '🎶', label: 'Notes'      },
      { id: 'headphones',  emoji: '🎧', label: 'Headphones' },
      { id: 'microphone',  emoji: '🎤', label: 'Mic'        },
      { id: 'guitar',      emoji: '🎸', label: 'Guitar'     },
      { id: 'piano',       emoji: '🎹', label: 'Piano'      },
      { id: 'drums',       emoji: '🥁', label: 'Drums'      },
      { id: 'vinyl',       emoji: '💿', label: 'Vinyl'      },
      { id: 'art-palette', emoji: '🎨', label: 'Art'        },
      { id: 'film',        emoji: '🎬', label: 'Film'       },
      { id: 'game',        emoji: '🎮', label: 'Game'       },
    ],
  },
];

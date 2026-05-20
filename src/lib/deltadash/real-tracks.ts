export type RealTrackSector = {
  startPercent: number;
  endPercent: number;
  type: 'corner_low_speed' | 'corner_medium_speed' | 'corner_high_speed' | 'straight';
};

export type RealTrackData = {
  id: string;
  name: string;
  sectors: RealTrackSector[];
};

export const REAL_TRACKS: Record<string, RealTrackData> = {
  "abuDhabi": {
    "id": "abu-dhabi-gp",
    "name": "Yas Marina Circuit",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.0402,
        "type": "straight"
      },
      {
        "startPercent": 0.0402,
        "endPercent": 0.0553,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.0553,
        "endPercent": 0.0603,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.0603,
        "endPercent": 0.0854,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.0854,
        "endPercent": 0.1256,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.1256,
        "endPercent": 0.1508,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.1508,
        "endPercent": 0.6734,
        "type": "straight"
      },
      {
        "startPercent": 0.6734,
        "endPercent": 0.6784,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.6784,
        "endPercent": 0.6935,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6935,
        "endPercent": 0.7236,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.7236,
        "endPercent": 0.7538,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7538,
        "endPercent": 0.7739,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.7739,
        "endPercent": 0.794,
        "type": "straight"
      },
      {
        "startPercent": 0.794,
        "endPercent": 0.804,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.804,
        "endPercent": 0.8141,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.8141,
        "endPercent": 0.8844,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.8844,
        "endPercent": 0.9045,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9045,
        "endPercent": 0.9347,
        "type": "straight"
      },
      {
        "startPercent": 0.9347,
        "endPercent": 0.9447,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.9447,
        "endPercent": 0.9548,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9548,
        "endPercent": 0.9899,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.9899,
        "endPercent": 1,
        "type": "corner_medium_speed"
      }
    ]
  },
  "austin": {
    "id": "austin-gp",
    "name": "Circuit of the Americas",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.402,
        "type": "straight"
      },
      {
        "startPercent": 0.402,
        "endPercent": 0.4472,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.4472,
        "endPercent": 0.4523,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4523,
        "endPercent": 0.4874,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.4874,
        "endPercent": 0.5126,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.5126,
        "endPercent": 0.5477,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.5477,
        "endPercent": 0.6633,
        "type": "straight"
      },
      {
        "startPercent": 0.6633,
        "endPercent": 0.6734,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6734,
        "endPercent": 0.7538,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.7538,
        "endPercent": 0.7588,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7588,
        "endPercent": 0.799,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.799,
        "endPercent": 0.8342,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.8342,
        "endPercent": 0.8844,
        "type": "straight"
      },
      {
        "startPercent": 0.8844,
        "endPercent": 0.8995,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.8995,
        "endPercent": 0.9548,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9548,
        "endPercent": 0.9899,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.9899,
        "endPercent": 1,
        "type": "corner_medium_speed"
      }
    ]
  },
  "bahrain": {
    "id": "bahrain-gp",
    "name": "Bahrain International Circuit",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.4523,
        "type": "straight"
      },
      {
        "startPercent": 0.4523,
        "endPercent": 0.4824,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4824,
        "endPercent": 0.5226,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.5226,
        "endPercent": 0.5477,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.5477,
        "endPercent": 0.5578,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.5578,
        "endPercent": 0.608,
        "type": "straight"
      },
      {
        "startPercent": 0.608,
        "endPercent": 0.6131,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.6131,
        "endPercent": 0.6231,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6231,
        "endPercent": 0.6583,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.6583,
        "endPercent": 0.6985,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6985,
        "endPercent": 1,
        "type": "straight"
      }
    ]
  },
  "baku": {
    "id": "baku-gp",
    "name": "Baku City Circuit",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.0251,
        "type": "straight"
      },
      {
        "startPercent": 0.0251,
        "endPercent": 0.0302,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.0302,
        "endPercent": 0.0352,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.0352,
        "endPercent": 0.0603,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.0603,
        "endPercent": 0.0905,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.0905,
        "endPercent": 0.1206,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.1206,
        "endPercent": 0.1407,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.1407,
        "endPercent": 0.1658,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.1658,
        "endPercent": 0.2261,
        "type": "straight"
      },
      {
        "startPercent": 0.2261,
        "endPercent": 0.2312,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.2312,
        "endPercent": 0.2362,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.2362,
        "endPercent": 0.2663,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.2663,
        "endPercent": 0.2714,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.2714,
        "endPercent": 0.3065,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.3065,
        "endPercent": 0.3166,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.3166,
        "endPercent": 0.4472,
        "type": "straight"
      },
      {
        "startPercent": 0.4472,
        "endPercent": 0.4975,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.4975,
        "endPercent": 0.5176,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.5176,
        "endPercent": 0.5327,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.5327,
        "endPercent": 0.598,
        "type": "straight"
      },
      {
        "startPercent": 0.598,
        "endPercent": 0.603,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.603,
        "endPercent": 0.608,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.608,
        "endPercent": 0.6382,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.6382,
        "endPercent": 0.6683,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6683,
        "endPercent": 0.6985,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.6985,
        "endPercent": 0.7186,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7186,
        "endPercent": 0.7487,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.7487,
        "endPercent": 1,
        "type": "straight"
      }
    ]
  },
  "catalunya": {
    "id": "catalunya-gp",
    "name": "Circuit de Barcelona-Catalunya",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.1457,
        "type": "straight"
      },
      {
        "startPercent": 0.1457,
        "endPercent": 0.1558,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.1558,
        "endPercent": 0.1608,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.1608,
        "endPercent": 0.206,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.206,
        "endPercent": 0.2764,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.2764,
        "endPercent": 0.3317,
        "type": "straight"
      },
      {
        "startPercent": 0.3317,
        "endPercent": 0.3417,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.3417,
        "endPercent": 0.3518,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.3518,
        "endPercent": 0.392,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.392,
        "endPercent": 0.4322,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4322,
        "endPercent": 0.4774,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.4774,
        "endPercent": 0.4975,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4975,
        "endPercent": 0.5126,
        "type": "straight"
      },
      {
        "startPercent": 0.5126,
        "endPercent": 0.5226,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.5226,
        "endPercent": 0.5327,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.5327,
        "endPercent": 0.5628,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.5628,
        "endPercent": 0.598,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.598,
        "endPercent": 0.603,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.603,
        "endPercent": 0.6432,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6432,
        "endPercent": 0.6784,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.6784,
        "endPercent": 0.7186,
        "type": "straight"
      },
      {
        "startPercent": 0.7186,
        "endPercent": 0.7236,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.7236,
        "endPercent": 0.7337,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7337,
        "endPercent": 0.7789,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.7789,
        "endPercent": 0.7889,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7889,
        "endPercent": 0.8392,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.8392,
        "endPercent": 0.8643,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.8643,
        "endPercent": 0.8693,
        "type": "straight"
      },
      {
        "startPercent": 0.8693,
        "endPercent": 0.8744,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.8744,
        "endPercent": 0.9246,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.9246,
        "endPercent": 0.9447,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9447,
        "endPercent": 0.9899,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.9899,
        "endPercent": 1,
        "type": "straight"
      }
    ]
  },
  "china": {
    "id": "china-gp",
    "name": "Shanghai International Circuit",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.2513,
        "type": "straight"
      },
      {
        "startPercent": 0.2513,
        "endPercent": 0.2663,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.2663,
        "endPercent": 0.2714,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.2714,
        "endPercent": 0.3116,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.3116,
        "endPercent": 0.3317,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.3317,
        "endPercent": 0.3769,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.3769,
        "endPercent": 0.392,
        "type": "straight"
      },
      {
        "startPercent": 0.392,
        "endPercent": 0.407,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.407,
        "endPercent": 0.4221,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4221,
        "endPercent": 0.4874,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.4874,
        "endPercent": 0.5126,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.5126,
        "endPercent": 0.5176,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.5176,
        "endPercent": 0.8543,
        "type": "straight"
      },
      {
        "startPercent": 0.8543,
        "endPercent": 0.8593,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.8593,
        "endPercent": 0.8643,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.8643,
        "endPercent": 0.8995,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.8995,
        "endPercent": 0.9397,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9397,
        "endPercent": 0.9598,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.9598,
        "endPercent": 0.9799,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9799,
        "endPercent": 0.9899,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.9899,
        "endPercent": 1,
        "type": "straight"
      }
    ]
  },
  "hungaroring": {
    "id": "hungaroring-gp",
    "name": "Hungaroring",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.1106,
        "type": "straight"
      },
      {
        "startPercent": 0.1106,
        "endPercent": 0.1156,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.1156,
        "endPercent": 0.1256,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.1256,
        "endPercent": 0.1709,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.1709,
        "endPercent": 0.201,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.201,
        "endPercent": 0.2312,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.2312,
        "endPercent": 0.2412,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.2412,
        "endPercent": 0.2864,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.2864,
        "endPercent": 0.3216,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.3216,
        "endPercent": 0.3417,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.3417,
        "endPercent": 0.3869,
        "type": "straight"
      },
      {
        "startPercent": 0.3869,
        "endPercent": 0.402,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.402,
        "endPercent": 0.4523,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4523,
        "endPercent": 0.4925,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.4925,
        "endPercent": 0.5276,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.5276,
        "endPercent": 0.5729,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.5729,
        "endPercent": 0.5829,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.5829,
        "endPercent": 0.6432,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.6432,
        "endPercent": 0.6583,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6583,
        "endPercent": 0.6633,
        "type": "straight"
      },
      {
        "startPercent": 0.6633,
        "endPercent": 0.6784,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6784,
        "endPercent": 0.6935,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.6935,
        "endPercent": 0.7437,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7437,
        "endPercent": 0.7588,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.7588,
        "endPercent": 0.7739,
        "type": "straight"
      },
      {
        "startPercent": 0.7739,
        "endPercent": 0.7889,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.7889,
        "endPercent": 0.794,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.794,
        "endPercent": 0.8342,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.8342,
        "endPercent": 0.8492,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.8492,
        "endPercent": 0.8995,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.8995,
        "endPercent": 0.9146,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9146,
        "endPercent": 0.9598,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.9598,
        "endPercent": 0.9849,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9849,
        "endPercent": 1,
        "type": "straight"
      }
    ]
  },
  "imola": {
    "id": "imola-gp",
    "name": "Autodromo Enzo e Dino Ferrari",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.1608,
        "type": "straight"
      },
      {
        "startPercent": 0.1608,
        "endPercent": 0.1658,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.1658,
        "endPercent": 0.1709,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.1709,
        "endPercent": 0.201,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.201,
        "endPercent": 0.2362,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.2362,
        "endPercent": 0.2613,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.2613,
        "endPercent": 0.2864,
        "type": "straight"
      },
      {
        "startPercent": 0.2864,
        "endPercent": 0.3065,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.3065,
        "endPercent": 0.3216,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.3216,
        "endPercent": 0.3417,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.3417,
        "endPercent": 0.3719,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.3719,
        "endPercent": 0.4171,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.4171,
        "endPercent": 0.4422,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4422,
        "endPercent": 0.4472,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.4472,
        "endPercent": 0.4824,
        "type": "straight"
      },
      {
        "startPercent": 0.4824,
        "endPercent": 0.5025,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.5025,
        "endPercent": 0.5477,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.5477,
        "endPercent": 0.5729,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.5729,
        "endPercent": 0.5879,
        "type": "straight"
      },
      {
        "startPercent": 0.5879,
        "endPercent": 0.603,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.603,
        "endPercent": 0.6131,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6131,
        "endPercent": 0.6432,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.6432,
        "endPercent": 0.6734,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6734,
        "endPercent": 0.7085,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.7085,
        "endPercent": 0.7136,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7136,
        "endPercent": 0.7538,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.7538,
        "endPercent": 0.7789,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7789,
        "endPercent": 0.799,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.799,
        "endPercent": 0.8593,
        "type": "straight"
      },
      {
        "startPercent": 0.8593,
        "endPercent": 0.8643,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.8643,
        "endPercent": 0.8744,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.8744,
        "endPercent": 0.9296,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.9296,
        "endPercent": 0.9548,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9548,
        "endPercent": 0.995,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.995,
        "endPercent": 1,
        "type": "straight"
      }
    ]
  },
  "interlagos": {
    "id": "interlagos-gp",
    "name": "Interlagos Circuit",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.0503,
        "type": "straight"
      },
      {
        "startPercent": 0.0503,
        "endPercent": 0.0553,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.0553,
        "endPercent": 0.0603,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.0603,
        "endPercent": 0.1206,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.1206,
        "endPercent": 0.1508,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.1508,
        "endPercent": 0.196,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.196,
        "endPercent": 0.4523,
        "type": "straight"
      },
      {
        "startPercent": 0.4523,
        "endPercent": 0.4623,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.4623,
        "endPercent": 0.5276,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.5276,
        "endPercent": 0.603,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.603,
        "endPercent": 0.6181,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6181,
        "endPercent": 0.6734,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.6734,
        "endPercent": 0.7136,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7136,
        "endPercent": 0.7337,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.7337,
        "endPercent": 0.7387,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7387,
        "endPercent": 0.7839,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.7839,
        "endPercent": 0.8191,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.8191,
        "endPercent": 0.8744,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.8744,
        "endPercent": 1,
        "type": "straight"
      }
    ]
  },
  "jeddah": {
    "id": "jeddah-gp",
    "name": "Jeddah Corniche Circuit",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.2111,
        "type": "straight"
      },
      {
        "startPercent": 0.2111,
        "endPercent": 0.2915,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.2915,
        "endPercent": 0.3166,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.3166,
        "endPercent": 0.3668,
        "type": "straight"
      },
      {
        "startPercent": 0.3668,
        "endPercent": 0.3719,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.3719,
        "endPercent": 0.3769,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.3769,
        "endPercent": 0.4121,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.4121,
        "endPercent": 0.4322,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4322,
        "endPercent": 0.4874,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.4874,
        "endPercent": 0.4925,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4925,
        "endPercent": 0.5075,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.5075,
        "endPercent": 0.5327,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.5327,
        "endPercent": 0.5628,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.5628,
        "endPercent": 0.8794,
        "type": "straight"
      },
      {
        "startPercent": 0.8794,
        "endPercent": 0.8844,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.8844,
        "endPercent": 0.8894,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.8894,
        "endPercent": 0.9196,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.9196,
        "endPercent": 0.9397,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9397,
        "endPercent": 0.9698,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.9698,
        "endPercent": 1,
        "type": "straight"
      }
    ]
  },
  "lasVegas": {
    "id": "las-vegas-gp",
    "name": "Las Vegas Strip Circuit",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.0251,
        "type": "straight"
      },
      {
        "startPercent": 0.0251,
        "endPercent": 0.0302,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.0302,
        "endPercent": 0.0352,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.0352,
        "endPercent": 0.0653,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.0653,
        "endPercent": 0.1106,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.1106,
        "endPercent": 0.1357,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.1357,
        "endPercent": 0.2261,
        "type": "straight"
      },
      {
        "startPercent": 0.2261,
        "endPercent": 0.2312,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.2312,
        "endPercent": 0.2362,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.2362,
        "endPercent": 0.2663,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.2663,
        "endPercent": 0.2864,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.2864,
        "endPercent": 0.2965,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.2965,
        "endPercent": 0.8141,
        "type": "straight"
      },
      {
        "startPercent": 0.8141,
        "endPercent": 0.8191,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.8191,
        "endPercent": 0.8241,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.8241,
        "endPercent": 0.8593,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.8593,
        "endPercent": 0.8744,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.8744,
        "endPercent": 0.8995,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.8995,
        "endPercent": 1,
        "type": "straight"
      }
    ]
  },
  "melbourne": {
    "id": "melbourne-gp",
    "name": "Albert Park Circuit",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.0402,
        "type": "straight"
      },
      {
        "startPercent": 0.0402,
        "endPercent": 0.0452,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.0452,
        "endPercent": 0.0503,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.0503,
        "endPercent": 0.0804,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.0804,
        "endPercent": 0.1106,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.1106,
        "endPercent": 0.1357,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.1357,
        "endPercent": 0.1709,
        "type": "straight"
      },
      {
        "startPercent": 0.1709,
        "endPercent": 0.1809,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.1809,
        "endPercent": 0.1859,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.1859,
        "endPercent": 0.2462,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.2462,
        "endPercent": 0.3015,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.3015,
        "endPercent": 0.3367,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.3367,
        "endPercent": 0.3467,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.3467,
        "endPercent": 0.3618,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.3618,
        "endPercent": 0.3869,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.3869,
        "endPercent": 0.4322,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.4322,
        "endPercent": 0.608,
        "type": "straight"
      },
      {
        "startPercent": 0.608,
        "endPercent": 0.6131,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.6131,
        "endPercent": 0.6683,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6683,
        "endPercent": 0.7085,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.7085,
        "endPercent": 0.7538,
        "type": "straight"
      },
      {
        "startPercent": 0.7538,
        "endPercent": 0.7588,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.7588,
        "endPercent": 0.7688,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7688,
        "endPercent": 0.804,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.804,
        "endPercent": 0.8291,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.8291,
        "endPercent": 0.8342,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.8342,
        "endPercent": 0.8643,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.8643,
        "endPercent": 0.9196,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.9196,
        "endPercent": 0.9397,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9397,
        "endPercent": 0.9698,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.9698,
        "endPercent": 1,
        "type": "straight"
      }
    ]
  },
  "mexicoCity": {
    "id": "mexico-city-gp",
    "name": "Autódromo Hermanos Rodríguez",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.2462,
        "type": "straight"
      },
      {
        "startPercent": 0.2462,
        "endPercent": 0.2563,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.2563,
        "endPercent": 0.2613,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.2613,
        "endPercent": 0.3317,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.3317,
        "endPercent": 0.3618,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.3618,
        "endPercent": 0.3869,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.3869,
        "endPercent": 0.4422,
        "type": "straight"
      },
      {
        "startPercent": 0.4422,
        "endPercent": 0.4472,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.4472,
        "endPercent": 0.4573,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4573,
        "endPercent": 0.5477,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.5477,
        "endPercent": 0.5779,
        "type": "straight"
      },
      {
        "startPercent": 0.5779,
        "endPercent": 0.598,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.598,
        "endPercent": 0.6181,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.6181,
        "endPercent": 0.6834,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6834,
        "endPercent": 0.7085,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.7085,
        "endPercent": 0.7437,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7437,
        "endPercent": 0.7739,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.7739,
        "endPercent": 0.8191,
        "type": "straight"
      },
      {
        "startPercent": 0.8191,
        "endPercent": 0.8241,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.8241,
        "endPercent": 0.8342,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.8342,
        "endPercent": 0.9598,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.9598,
        "endPercent": 0.995,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.995,
        "endPercent": 1,
        "type": "corner_high_speed"
      }
    ]
  },
  "miami": {
    "id": "miami-gp",
    "name": "Miami International Autodrome",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.2764,
        "type": "straight"
      },
      {
        "startPercent": 0.2764,
        "endPercent": 0.2814,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.2814,
        "endPercent": 0.3216,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.3216,
        "endPercent": 0.3417,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.3417,
        "endPercent": 0.3769,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.3769,
        "endPercent": 0.5578,
        "type": "straight"
      },
      {
        "startPercent": 0.5578,
        "endPercent": 0.5628,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.5628,
        "endPercent": 0.5678,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.5678,
        "endPercent": 0.6181,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.6181,
        "endPercent": 0.8844,
        "type": "straight"
      },
      {
        "startPercent": 0.8844,
        "endPercent": 0.8894,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.8894,
        "endPercent": 0.8945,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.8945,
        "endPercent": 0.9296,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.9296,
        "endPercent": 0.9548,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9548,
        "endPercent": 0.9899,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.9899,
        "endPercent": 1,
        "type": "straight"
      }
    ]
  },
  "monaco": {
    "id": "monaco-gp",
    "name": "Circuit de Monaco",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.1759,
        "type": "straight"
      },
      {
        "startPercent": 0.1759,
        "endPercent": 0.1859,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.1859,
        "endPercent": 0.206,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.206,
        "endPercent": 0.2864,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.2864,
        "endPercent": 0.3065,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.3065,
        "endPercent": 0.4523,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.4523,
        "endPercent": 0.4925,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4925,
        "endPercent": 0.5829,
        "type": "straight"
      },
      {
        "startPercent": 0.5829,
        "endPercent": 0.593,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.593,
        "endPercent": 0.603,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.603,
        "endPercent": 0.6633,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.6633,
        "endPercent": 0.6985,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6985,
        "endPercent": 0.7286,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.7286,
        "endPercent": 0.7538,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7538,
        "endPercent": 0.7739,
        "type": "straight"
      },
      {
        "startPercent": 0.7739,
        "endPercent": 0.7889,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7889,
        "endPercent": 0.9296,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.9296,
        "endPercent": 0.9698,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9698,
        "endPercent": 1,
        "type": "straight"
      }
    ]
  },
  "montreal": {
    "id": "montreal-gp",
    "name": "Circuit Gilles Villeneuve",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.0201,
        "type": "straight"
      },
      {
        "startPercent": 0.0201,
        "endPercent": 0.0302,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.0302,
        "endPercent": 0.0402,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.0402,
        "endPercent": 0.1005,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.1005,
        "endPercent": 0.1156,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.1156,
        "endPercent": 0.4271,
        "type": "straight"
      },
      {
        "startPercent": 0.4271,
        "endPercent": 0.4322,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.4322,
        "endPercent": 0.4422,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4422,
        "endPercent": 0.4824,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.4824,
        "endPercent": 0.5126,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.5126,
        "endPercent": 0.5377,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.5377,
        "endPercent": 0.5779,
        "type": "straight"
      },
      {
        "startPercent": 0.5779,
        "endPercent": 0.5879,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.5879,
        "endPercent": 0.598,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.598,
        "endPercent": 0.6432,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.6432,
        "endPercent": 0.6734,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6734,
        "endPercent": 0.7085,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.7085,
        "endPercent": 0.8643,
        "type": "straight"
      },
      {
        "startPercent": 0.8643,
        "endPercent": 0.8744,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.8744,
        "endPercent": 0.8794,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.8794,
        "endPercent": 0.9146,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.9146,
        "endPercent": 0.9447,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9447,
        "endPercent": 0.9849,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.9849,
        "endPercent": 1,
        "type": "straight"
      }
    ]
  },
  "monza": {
    "id": "monza-gp",
    "name": "Autodromo Nazionale Monza",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.1357,
        "type": "straight"
      },
      {
        "startPercent": 0.1357,
        "endPercent": 0.1407,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.1407,
        "endPercent": 0.1809,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.1809,
        "endPercent": 0.201,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.201,
        "endPercent": 0.2261,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.2261,
        "endPercent": 0.6633,
        "type": "straight"
      },
      {
        "startPercent": 0.6633,
        "endPercent": 0.6683,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.6683,
        "endPercent": 0.6734,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6734,
        "endPercent": 0.6884,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.6884,
        "endPercent": 0.7136,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7136,
        "endPercent": 0.7437,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.7437,
        "endPercent": 1,
        "type": "straight"
      }
    ]
  },
  "qatar": {
    "id": "qatar-gp",
    "name": "Lusail International Circuit",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.1156,
        "type": "straight"
      },
      {
        "startPercent": 0.1156,
        "endPercent": 0.1206,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.1206,
        "endPercent": 0.1307,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.1307,
        "endPercent": 0.1558,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.1558,
        "endPercent": 0.191,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.191,
        "endPercent": 0.2111,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.2111,
        "endPercent": 0.2362,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.2362,
        "endPercent": 0.2563,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.2563,
        "endPercent": 0.2864,
        "type": "straight"
      },
      {
        "startPercent": 0.2864,
        "endPercent": 0.3015,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.3015,
        "endPercent": 0.3668,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.3668,
        "endPercent": 0.3719,
        "type": "straight"
      },
      {
        "startPercent": 0.3719,
        "endPercent": 0.3869,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.3869,
        "endPercent": 0.4271,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.4271,
        "endPercent": 0.4623,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4623,
        "endPercent": 0.4975,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.4975,
        "endPercent": 0.5226,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.5226,
        "endPercent": 0.5276,
        "type": "straight"
      },
      {
        "startPercent": 0.5276,
        "endPercent": 0.5628,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.5628,
        "endPercent": 0.5678,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.5678,
        "endPercent": 0.598,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.598,
        "endPercent": 0.6231,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6231,
        "endPercent": 0.6533,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.6533,
        "endPercent": 0.7286,
        "type": "straight"
      },
      {
        "startPercent": 0.7286,
        "endPercent": 0.8291,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.8291,
        "endPercent": 0.8442,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.8442,
        "endPercent": 0.8744,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.8744,
        "endPercent": 0.8794,
        "type": "straight"
      },
      {
        "startPercent": 0.8794,
        "endPercent": 0.8995,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.8995,
        "endPercent": 0.9095,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9095,
        "endPercent": 0.9347,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.9347,
        "endPercent": 0.9598,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9598,
        "endPercent": 0.9799,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.9799,
        "endPercent": 1,
        "type": "straight"
      }
    ]
  },
  "silverstone": {
    "id": "silverstone-gp",
    "name": "Silverstone Grand Prix",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.0603,
        "type": "straight"
      },
      {
        "startPercent": 0.0603,
        "endPercent": 0.1256,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.1256,
        "endPercent": 0.5075,
        "type": "straight"
      },
      {
        "startPercent": 0.5075,
        "endPercent": 0.5528,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.5528,
        "endPercent": 0.8392,
        "type": "straight"
      },
      {
        "startPercent": 0.8392,
        "endPercent": 0.8442,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.8442,
        "endPercent": 0.8945,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.8945,
        "endPercent": 0.9045,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.9045,
        "endPercent": 0.9095,
        "type": "straight"
      },
      {
        "startPercent": 0.9095,
        "endPercent": 0.9196,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.9196,
        "endPercent": 0.9296,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9296,
        "endPercent": 0.9698,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.9698,
        "endPercent": 1,
        "type": "corner_medium_speed"
      }
    ]
  },
  "singapore": {
    "id": "singapore-gp",
    "name": "Marina Bay Street Circuit",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.1508,
        "type": "straight"
      },
      {
        "startPercent": 0.1508,
        "endPercent": 0.1809,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.1809,
        "endPercent": 0.2111,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.2111,
        "endPercent": 0.2362,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.2362,
        "endPercent": 0.2613,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.2613,
        "endPercent": 0.3367,
        "type": "straight"
      },
      {
        "startPercent": 0.3367,
        "endPercent": 0.3417,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.3417,
        "endPercent": 0.3467,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.3467,
        "endPercent": 0.4673,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.4673,
        "endPercent": 0.4774,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4774,
        "endPercent": 0.5075,
        "type": "straight"
      },
      {
        "startPercent": 0.5075,
        "endPercent": 0.5176,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.5176,
        "endPercent": 0.5226,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.5226,
        "endPercent": 0.5879,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.5879,
        "endPercent": 0.598,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.598,
        "endPercent": 0.6432,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.6432,
        "endPercent": 0.6633,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6633,
        "endPercent": 0.6884,
        "type": "straight"
      },
      {
        "startPercent": 0.6884,
        "endPercent": 0.7035,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.7035,
        "endPercent": 0.7136,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7136,
        "endPercent": 0.7538,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.7538,
        "endPercent": 0.7789,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7789,
        "endPercent": 0.794,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.794,
        "endPercent": 1,
        "type": "straight"
      }
    ]
  },
  "spa": {
    "id": "spa-gp",
    "name": "Circuit de Spa-Francorchamps",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.3266,
        "type": "straight"
      },
      {
        "startPercent": 0.3266,
        "endPercent": 0.3317,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.3317,
        "endPercent": 0.3367,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.3367,
        "endPercent": 0.3668,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.3668,
        "endPercent": 0.402,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.402,
        "endPercent": 0.4171,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.4171,
        "endPercent": 0.4221,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4221,
        "endPercent": 0.4523,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.4523,
        "endPercent": 0.4623,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4623,
        "endPercent": 0.4724,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.4724,
        "endPercent": 0.4925,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4925,
        "endPercent": 0.5226,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.5226,
        "endPercent": 0.5327,
        "type": "straight"
      },
      {
        "startPercent": 0.5327,
        "endPercent": 0.5829,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.5829,
        "endPercent": 0.6231,
        "type": "straight"
      },
      {
        "startPercent": 0.6231,
        "endPercent": 0.6281,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.6281,
        "endPercent": 0.6382,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6382,
        "endPercent": 0.6734,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.6734,
        "endPercent": 0.6985,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6985,
        "endPercent": 0.7186,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.7186,
        "endPercent": 0.7387,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7387,
        "endPercent": 0.7739,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.7739,
        "endPercent": 1,
        "type": "straight"
      }
    ]
  },
  "spielberg": {
    "id": "spielberg-gp",
    "name": "Red Bull Ring Spielberg",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.6633,
        "type": "straight"
      },
      {
        "startPercent": 0.6633,
        "endPercent": 0.7437,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7437,
        "endPercent": 0.7889,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.7889,
        "endPercent": 0.8492,
        "type": "straight"
      },
      {
        "startPercent": 0.8492,
        "endPercent": 0.8593,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.8593,
        "endPercent": 0.9095,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9095,
        "endPercent": 0.9347,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.9347,
        "endPercent": 0.9648,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9648,
        "endPercent": 1,
        "type": "corner_high_speed"
      }
    ]
  },
  "suzuka": {
    "id": "suzuka-gp",
    "name": "Suzuka Circuit",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.1156,
        "type": "straight"
      },
      {
        "startPercent": 0.1156,
        "endPercent": 0.1206,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.1206,
        "endPercent": 0.1307,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.1307,
        "endPercent": 0.1558,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.1558,
        "endPercent": 0.2663,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.2663,
        "endPercent": 0.2714,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.2714,
        "endPercent": 0.3166,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.3166,
        "endPercent": 0.3367,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.3367,
        "endPercent": 0.3769,
        "type": "straight"
      },
      {
        "startPercent": 0.3769,
        "endPercent": 0.3869,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.3869,
        "endPercent": 0.4121,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4121,
        "endPercent": 0.4372,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.4372,
        "endPercent": 0.4573,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4573,
        "endPercent": 0.4774,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.4774,
        "endPercent": 0.4874,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4874,
        "endPercent": 0.5226,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.5226,
        "endPercent": 0.5477,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.5477,
        "endPercent": 0.5678,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.5678,
        "endPercent": 0.6382,
        "type": "straight"
      },
      {
        "startPercent": 0.6382,
        "endPercent": 0.6482,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.6482,
        "endPercent": 0.6734,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6734,
        "endPercent": 0.6985,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.6985,
        "endPercent": 0.7186,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7186,
        "endPercent": 0.7538,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.7538,
        "endPercent": 0.9095,
        "type": "straight"
      },
      {
        "startPercent": 0.9095,
        "endPercent": 0.9196,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9196,
        "endPercent": 0.9548,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.9548,
        "endPercent": 0.9799,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.9799,
        "endPercent": 1,
        "type": "corner_high_speed"
      }
    ]
  },
  "zandvoort": {
    "id": "zandvoort-gp",
    "name": "Circuit Zandvoort",
    "sectors": [
      {
        "startPercent": 0,
        "endPercent": 0.0452,
        "type": "straight"
      },
      {
        "startPercent": 0.0452,
        "endPercent": 0.0503,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.0503,
        "endPercent": 0.0603,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.0603,
        "endPercent": 0.1055,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.1055,
        "endPercent": 0.1508,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.1508,
        "endPercent": 0.2161,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.2161,
        "endPercent": 0.2462,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.2462,
        "endPercent": 0.2714,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.2714,
        "endPercent": 0.3618,
        "type": "straight"
      },
      {
        "startPercent": 0.3618,
        "endPercent": 0.3769,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.3769,
        "endPercent": 0.4271,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.4271,
        "endPercent": 0.4573,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.4573,
        "endPercent": 0.5075,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.5075,
        "endPercent": 0.6181,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.6181,
        "endPercent": 0.6482,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.6482,
        "endPercent": 0.6533,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.6533,
        "endPercent": 0.6935,
        "type": "straight"
      },
      {
        "startPercent": 0.6935,
        "endPercent": 0.7035,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.7035,
        "endPercent": 0.7136,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.7136,
        "endPercent": 0.7688,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.7688,
        "endPercent": 0.8141,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.8141,
        "endPercent": 0.8291,
        "type": "corner_low_speed"
      },
      {
        "startPercent": 0.8291,
        "endPercent": 0.8643,
        "type": "corner_medium_speed"
      },
      {
        "startPercent": 0.8643,
        "endPercent": 0.9246,
        "type": "corner_high_speed"
      },
      {
        "startPercent": 0.9246,
        "endPercent": 1,
        "type": "straight"
      }
    ]
  }
};

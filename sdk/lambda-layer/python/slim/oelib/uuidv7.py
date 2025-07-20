import os
import time
import struct
import uuid
import random

import oelib.string
BASE36_CHARS = oelib.string.BASE36_CHARS
BASE62_CHARS = oelib.string.BASE62_CHARS


class UUID(uuid.UUID):
    def __init__(self, *args, **kyargs):
        if 'base36' in kyargs:
            num = 0
            for char in kyargs['base36']:
                num = num * 36 + BASE36_CHARS.index(char)
            super().__init__(int=num)

        elif 'base62' in kyargs:
            num = 0
            for char in kyargs['base62']:
                num = num * 62 + BASE62_CHARS.index(char)
            super().__init__(int=num)
        else: super().__init__(*args, **kyargs)

    @property
    def base36(self):
        num = self.int
        if num == 0: return '0'
        digits = []
        while num:
            num, rem = divmod(num, 36)
            digits.append(BASE36_CHARS[rem])
        return ''.join(reversed(digits))

    @property
    def base62(self):
        num = self.int
        digits = []
        while num:
            num, rem = divmod(num, 62)
            digits.append(BASE62_CHARS[rem])
        return ''.join(reversed(digits))
    
    @property
    def shard_suffix(self):
        if self.version != 8: raise ValueError("Only UUIDv8 can have a shard suffix")

        uuidBytes = bytearray(self.bytes)
        upperBits = uuidBytes[6] & 0x0F
        lowerBits = uuidBytes[7]
        suffix = (upperBits << 8) | lowerBits
        return suffix


def uuid7():
    epochMillis = int(time.time() * 1000)
    randomBytes = os.urandom(10)
    timestamp = epochMillis << 16
    uuidBytes = struct.pack('>Q', timestamp)[:6] + randomBytes
    uuidBytes = bytearray(uuidBytes)
    uuidBytes[8] = 0x80 | (uuidBytes[8] & 0x3F)
    uuidBytes[6] = 0x70 | (uuidBytes[6] & 0x0F)
    return UUID(uuidBytes.hex())


def uuid8(count):
    shardSuffix = random.randint(0, int(count)-1)

    epochMillis = int(time.time() * 1000)
    randomBytes = os.urandom(10)
    timestamp = epochMillis << 16
    uuidBytes = struct.pack('>Q', timestamp)[:6] + randomBytes
    uuidBytes = bytearray(uuidBytes)
    uuidBytes[8] = 0x80 | (uuidBytes[8] & 0x3F)
    uuidBytes[6] = 0x80 | (uuidBytes[6] & 0x0F)
    shardSuffix = shardSuffix & 0xFFF
    uuidBytes[6] = (uuidBytes[6] & 0xF0) | ((shardSuffix >> 8) & 0x0F)
    uuidBytes[7] = shardSuffix & 0xFF
    return UUID(uuidBytes.hex())

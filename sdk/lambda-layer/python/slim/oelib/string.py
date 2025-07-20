from datetime import datetime
import re


BASE36_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz'
BASE58_CHARS = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'


def kebabToPascal(kebab_string):
    words = kebab_string.lower().split('-')
    return ''.join([word.capitalize() for word in words])


def pascalToSnake(pascal_string):
    snake_string = re.sub(r'(?<!^)(?=[A-Z])', '_', pascal_string).lower()
    return snake_string


def iso8061(value):
    return datetime.utcfromtimestamp(float(value)).isoformat()

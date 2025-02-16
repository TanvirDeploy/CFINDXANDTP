import sys

import yt_dlp

NO_DIFFERENCE = object()


def deep_diff(a, b):
    if not isinstance(b, type(a)):
        return b

    if isinstance(a, dict):
        assert isinstance(b, dict)
        result = {}
        for key, value in b.items():
            difference = deep_diff(a.get(key), value)
            if difference is not NO_DIFFERENCE:
                result[key] = difference

        return result if result else NO_DIFFERENCE

    if isinstance(a, (list, tuple)):
        assert isinstance(b, (list, tuple))
        result = [
            b_val for b_val in b
            if not any(deep_diff(a_val, b_val) is NO_DIFFERENCE for a_val in a)
        ]

        return type(a)(result) if result else NO_DIFFERENCE

    return b if a != b else NO_DIFFERENCE


def cli_to_api(options):
    default_options = yt_dlp.parse_options([]).ydl_opts
    parsed_options = yt_dlp.parse_options(options).ydl_opts

    diff = deep_diff(default_options, parsed_options)
    return {} if diff is NO_DIFFERENCE else diff

import pprint

try:
    pprint.pprint(cli_to_api(sys.argv[1:]))
except Exception as error:
    print(error)
    sys.exit(1)

sys.exit(0)

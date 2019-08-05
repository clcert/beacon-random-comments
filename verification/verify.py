import argparse
import random
import requests
import json


def get_seed(pulse_url):
    """
    Given a pulse url does a GET request to the Random UChile API to get the seed given by that pulse.
    :param pulse_url: String representing the URL of the pulse.
    :return: A 512-bit random string that can be used as seed by a pseudo random generator.
    """
    response = requests.get(pulse_url)
    return response.json()['pulse']['outputValue']


def verify(draw):
    """
    Given a draw dictionary obtained after executing the Beacon Random Comments extension, simulates the process of
    choosing a winner given a retries number, returning True if the selected comment of the draw dictionary matches the
    comment obtained after executing the simulation.
    :param draw: Python dictionary of the form
            {
                "host": "some_host_name",
                "post_comment": "some_comment",
                "draw_date": "YYYY-MM-DDTHH:mm:ss.sssZ",
                "comments_number": n
                "pulse_url":"https://beacon.clcert.cl/beacon/2.0/chain/4/pulse/some_id",
                "post_url":"https://www.instagram.com/p/some_post_id/",
                "retries": m,
                "selected_comment": {"user": "selected_user", "comment": "selected_comment"},
                "comments": {"user": "user_1", "comment": "comment_1"},..., {"user": "user_n", "comment": "comment_n"}}
            }
    :return: True if the given dictionary represents a valid draw, else False.
    """
    random.seed(get_seed(draw["pulse_url"]))

    round_winner = 0
    for i in range(draw["retries"]):
        round_winner = random.randint(0, draw.comments_number)  # TODO: Replace with Franco's script

    picked = draw["comments"][round_winner]
    official = draw["selected_comment"]
    return picked["user"] == official["user"] and picked["comment"] == official["comment"]


def main(args):
    filename = args.file

    draw_content = None
    with open(filename, "r", encoding="utf-8") as file:
        try:
            draw_content = json.load(file)
        except ValueError:
            print(f"There was an error when decoding the file: {filename}. Please verify is JSON formatted")

    result = "successful" if verify(draw_content) else "unsuccessful"
    print(f"The verification was {result}")


if __name__ == "__main__":
    description = "Python verification script for Beacon Random Comments web extension. Takes a JSON file as " \
                  "argument and use its content to simulate the draw and compare the result to the official result."
    parser = argparse.ArgumentParser(description=description)

    parser.add_argument("-f", "--file",
                        help="JSON file containing a draw description, should follow the structure:\n" +
                             '{' +
                             '  "host": "some_host_name",\n' +
                             '  "post_comment": "some_comment",\n' +
                             '  "draw_date": "YYYY-MM-DDTHH:mm:ss.sssZ",\n' +
                             '  "comments_number": n,\n' +
                             '  "pulse_url":"https://beacon.clcert.cl/beacon/2.0/chain/4/pulse/some_id",\n' +
                             '  "post_url":"https://www.instagram.com/p/some_post_id/",\n' +
                             '  "retries": m,\n' +
                             '  "selected_comment": {"user": "selected_user", "comment": "selected_comment"},\n' +
                             '  "comments": {"user": "user_1", "comment": "comment_1"},..., ' +
                             '{"user": "user_n", "comment": "comment_n"}}\n' +
                             '}'
                        ,
                        default="draw.json",
                        type=str)

    main(parser.parse_args())

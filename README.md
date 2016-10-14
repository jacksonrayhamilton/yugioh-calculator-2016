# Yugioh Calculator 2016

<img alt="Screenshot of Yugioh Calculator's equation builder and coin flipper / die roller"
     src="screenshot.png"
     align="right"/>

Check out the app at [www.yugiohcalculator.com](https://www.yugiohcalculator.com/)!

Welcome to the source code for the 2016 edition of Yugioh Calculator, a web app
for tracking life points in a game of Yu-Gi-Oh!

I've stripped down the set of features to only what is absolutely necessary, or
exceptionally useful, for dueling.  The hope is that Yugioh Calculator will
remain the simplest, most intuitive and most powerful calculator available.

Yugioh Calculator 2016 boasts the following features:

- Dual life point viewing and manipulation
- Ultra efficient quantity entry; only 2-3 clicks to modify either player's life
  by most amounts
- 1-click life points reset
- Dice, coins
- Undo
- History of life point modifications
- Match timer, 1-click to reset

The design has also been revamped to distribute space more economically, and to
be "flatter," and the colors are bolder.

## Development

Install Node.js.  Then, run the following commands from the project root:

```js
npm i
npm start
```

The app will be available at [localhost:3333](http://localhost:3333).

Test that the code is still clean and working with `npm test`.

## Deployment

Create a ".env" file at the project root with contents similar to the following
(customize the values to your liking):

```sh
#!/usr/bin/env bash
export SSH_USER=user
export SSH_HOSTNAME=example.com
export REMOTE_PROD_DEST_DIR=/var/www/example.com/html/
export SERVER_RELOAD_COMMAND='sudo service nginx reload'
```

Run `scripts/deploy.sh` to synchronize the built app with your web server.

## Contributing

Ideas and pull requests are welcome.  Extreme minimalism is a goal.

Special thanks to [Caleb Evans](http://calebevans.me) for making the "Heads" and
"Tails" icons.

## License

GPL (see LICENSE.txt).  Happy hacking!

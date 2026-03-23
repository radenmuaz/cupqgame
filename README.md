# Cupqgame

A simple browser-based logic game where you guess the correct arrangement of 4 uniquely colored cups. It is similar to a simplified version of Mastermind but with swapping instead of picking from a pool of colors.

## How to Play

1. **The Goal**: The computer will secretly choose a random arrangement of 4 colored cups (Red, Blue, Green, Yellow). Your goal is to arrange your cups in the exact same order.
2. **Make a Guess**: Click on any two cups to swap their positions.
3. **Submit**: Once you are satisfied with your arrangement, click **"Submit Guess"**.
4. **Feedback**: The game will track your past guesses. For each guess, it will tell you exactly how many cups are in the correct position. Use this feedback to deduce the hidden arrangement!
5. **Win**: You win when all 4 cups are in the correct position (4 / 4). 

## Running the Game

Simply double-click or open `index.html` in your web browser to play. There are no build steps or dependencies required!

## Files

- `index.html`: Contains the layout, structure, and styling for the game interface.
- `script.js`: Contains all the logic for tracking state, handling user interaction, and checking win conditions.
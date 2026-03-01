import random

def scramble_csv():
    input_file = 'coords.csv'
    output_file = 'new_coords.csv'
    
    try:
        print(f"Reading {input_file}...")
        
        # Read the file and filter out any empty lines
        with open(input_file, 'r', encoding='utf-8') as f:
            lines = [line.strip() for line in f if line.strip()]
            
        print(f"Found {len(lines)} coordinates. Scrambling...")
        
        # random.shuffle performs an in-place Fisher-Yates shuffle automatically
        random.shuffle(lines)
        
        # Write the shuffled lines back to a new file
        with open(output_file, 'w', encoding='utf-8') as f:
            for line in lines:
                f.write(line + '\n')
                
        print(f"Success! Saved scrambled coordinates to {output_file}")
        
    except FileNotFoundError:
        print(f"Error: Could not find '{input_file}'. Make sure it's in the same folder.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    scramble_csv()

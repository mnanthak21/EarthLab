import comtradeapicall
import pandas as pd
import json #Part of python standard library
from google import genai
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

COMTRADE_API_CALLS = os.getenv('COMTRADE_API_CALLS')
# COMTRADE_API_CALLS = 'c7c449e86a174f448f873ea43b9bceec'
GOOGLE_GEN_AI = os.getenv('GOOGLE_GEN_AI')

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Input datatype can be changed depending on Gemini output format
def queryComtrade(
	year:str, 
	dest_country:str, 
	commodity:str, 
	comtrade_key:str
	comtrade_key:str
	):
    	
	# This returns a list of dicts with all the 'partner' entries
	# partners = comtradeapicall.getReference('partner')
	#partners.to_json('partner_list.json')

	# defaults to None with invalid input which makes it 'all countries'
	# country_codes = comtradeapicall.convertCountryIso3ToCode('156,484,458,392,410')


	mydf = comtradeapicall.getTradeMatrix(
		comtrade_key,
		typeCode='C',
		freqCode='A',

		# Variables affected by input
		period=year, 
		reporterCode=dest_country, 
		cmdCode=commodity, #Use SITC codes


		flowCode='M',
		partnerCode=None,                                        
		aggregateBy=None, 
		includeDesc=True
	)
	

	if mydf.empty:	
		print("empty")
	else:	
		# Clean data - omit groups of countries, special countries and world
		mydf = mydf[mydf['partnerDesc'] != 'World']

		# <, nes>  needs to be ommitted. For some reason groups of countries
		# have this identifier; "Not Elsewhere specified"
		# Because of Taiwan semiconductors we may need to rethink this
		mydf = mydf[~mydf['partnerDesc'].str.contains(', nes',
											 case=False, na=False)]
		# Sort in Descending Order
		mydf = mydf.sort_values(by='primaryValue', ascending=False)

		# Select the top 5
		mydf = mydf.head(5)

		# Select columns of interest
		filtered_df = mydf[[
				'partnerDesc', # Source Country
				'cmdDesc', # Commodity
				'primaryValue', # Value of trade
				'reporterDesc' # Destination Country
		]]

		# Stack data frames together from successive calls to comtrade
		# global df # Declare global variable for access
		return filtered_df
	
		# Print each df for each commodity
		#print(filtered_df)
		# print(filtered_df)
		#print("----------------------------")

def get_trade_data(product:str, country:str):
	"""
	Performs all backend operations

	Inputs: 
		product (str): the imported product code
		country (str): the destination country code

	Returns:
		a dataframe containing edges in the format
			src_country item value dest_country
	"""

	#Global data frame to assisst with merging
	# df = pd.DataFrame()

	# To reduce UI elements, year is preset to 2017
	year = '2017'

	# API KEYS
	comtrade_key = COMTRADE_API_CALLS
	gemini_key = GOOGLE_GEN_AI

	# Consider error checking for demand spikes
	client = genai.Client(api_key = GOOGLE_GEN_AI)
	response = client.models.generate_content(
		model="gemini-3-flash-preview",                                             
		config=genai.types.GenerateContentConfig(
			response_mime_type="application/json",
		),                                                                          
		contents=f"""
				List between 5 and 10 major components of {product} in
				{country} using only 3 digit UN Comtrade SITC commodity codes.
				Let some of these components be raw natural resources. Return
				a JSON array of these codes.
				"""
	 )
                                                  
	data = json.loads(response.text) #returns an array
	results_list = []

	# Run a UN Query for each value returned by GEMAPI       
	for item in data:
		results_list.append(queryComtrade(year, country, item, comtrade_key))
	final_df = pd.concat(results_list, ignore_index=True)
	

	return final_df

@app.route('/api/trade', methods=['POST'])
def get_trade():
	"""
	Flask endpoint to get trade data
	
	Expects JSON body:
	{
		"product": "Ford F150",
		"country": "842"
	}
	
	Returns JSON with trade data
	"""
	try:
		data = request.get_json()
		product = data.get('product')
		country = data.get('country')
		
		if not product or not country:
			return jsonify({'error': 'Missing product or country parameter'}), 400
		
		# Get trade data
		df = get_trade_data(product, country)
		
		if df.empty:
			return jsonify({'error': 'No trade data found'}), 404
		
		# Convert dataframe to JSON format
		result = df.to_dict(orient='records')
		
		return jsonify({
			'success': True,
			'data': result
		})
		
	except Exception as e:
		return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
	app.run(debug=True, port=5000)

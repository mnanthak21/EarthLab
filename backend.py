import comtradeapicall
import pandas as pd
import json #Part of python standard library
from google import genai

# Input from another program
product = 'Ford F150'
country = '842' #Needs country code to work not ISO: 'USA'
year = '2017'

# Input datatype can be changed depending on Gemini output format
def queryComtrade(
	year:str, 
	dest_country:str, 
	commodity:str, 
	comtrade_key:str,
	df
	):
    	
	# This returns a list of dicts with all the 'partner' entries
	# partners = comtradeapicall.getReference('partner')
	#partners.to_json('partner_list.json')

	# defaults to None with invalid input which makes it 'all countries'
	# country_codes = comtradeapicall.convertCountryIso3ToCode('156,484,458,392,410')

	#print(f"Item started: {commodity}")
	#print(f"Year: {year}")
	#print(f"dest_country: {dest_country}")
	# Variables
	#year = year
	#dest_country = dest_country
	#commodity = commodity


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
		if df.empty:
			df = filtered_df
		else: 
			df = pd.concat([df, filtered_df], ignore_index=True)
	
		# Print each df for each commodity
		#print(filtered_df)
		#print("----------------------------")

def main(product:str, country:str):
	"""
	Performs all backend operations

	Inputs: 
		product (str): the imported product code
		country (str): the destination country code

	Returns:
		a dataframe containing edges in the format
			src_country item value dest_country
		
		or writes to a JSON file
	"""


	#Global data frame to assisst with merging
	df = pd.DataFrame()

	# To reduce UI elements, year is preset to 2017
	year = '2017'

	# API KEYS
	comtrade_key = 'c2a6c9f0ff0c43d281f85cea03c83d2d'
	gemini_key = "AIzaSyAST_ynj0dCY9-8EhNQjivT-_l-0RZ8UCg"


	# Consider error checking for demand spikes                                     
	client = genai.Client(api_key = gemini_key)                                               
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

	
	# Run a UN Query for each value returned by GEMAPI       
	for item in data:
		#print(item)
		queryComtrade(year, country, item, comtrade_key, df)
		#print(f"{item}, type: {type(item)}")

	df.to_json('data.json')

	# return df



main(product, country)

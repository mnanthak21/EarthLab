import geopandas as gpd
from shapely.geometry import Polygon, MultiPolygon
import random

# 1. Load the dataset
gdf = gpd.read_file("ne_110m_admin_0_countries.zip")

# 2. Open the file for writing
with open('coords.csv', 'w') as f:
    # Optional: Write a header if your JS code expects one
    # f.write("lat,lon\n")

    for index, row in gdf.iterrows():
        num = random.randint(0, 10)
        if (num < 10):
            continue

        geom = row.geometry
        
        # Handle both Polygon and MultiPolygon
        if isinstance(geom, Polygon):
            polygons = [geom]
        elif isinstance(geom, MultiPolygon):
            polygons = list(geom.geoms)
        else:
            continue

        for poly in polygons:
            # .exterior.coords gives the outer border points
            for lon, lat in poly.exterior.coords:
                f.write(f'{lat}, {lon}\n')
            
            # Optional: Add a "separator" line (like a blank line or null)
            # This helps your JS know when one country ends and another begins
            # f.write("null,null\n")

print("Done! coords.csv created.")
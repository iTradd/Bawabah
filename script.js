// B1'!) BJE) API_URL EF E*:J1 'D(J&)
const apiUrl = process.env.API_URL;

// '3*./'E 'DE*:J1
fetch(`${apiUrl}?action=getProperties&sheet=Real_Estate`)
    .then(response => response.json())
    .then(data => console.log(data)) // JECFC '3*(/'D console.log (9EDJ) #.1I DE9'D,) 'D(J'F'*
    .catch(error => console.error('Error fetching properties:', error));

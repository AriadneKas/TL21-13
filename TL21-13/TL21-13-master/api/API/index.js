//We run the app with this command in the terminal
//powershell -ExecutionPolicy Bypass -File C:\Users\krisk\AppData\Roaming\npm\nodemon.ps1
const express = require("express");
const app = express()
const url = require('url');
var mysql = require('mysql');

//this is needed to convert a json object to csv
const { Parser } = require('json2csv');

//this is needed for frontend
const cors = require('cors');

//localhost's port
const port = 9103;

//Initialise a variable having our database's informations (it runs locally using xampp)
var con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'softeng2113',
  database: 'softeng2113'
});

//Initialise cors for frontend
var corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200, // For legacy browser support
    methods: "GET"
}

app.use(cors(corsOptions));

//Initialise server
app.listen(port, () =>
	console.log('Server is alive on http://localhost:' + port + '/interoperability/api')
)

//Connect with the database 
con.connect(function(err) {
	  if (err) throw err;
	  console.log("Connected to database!");
});

//GET Methods

//Base URL screen
app.get('/interoperability/api', (req,res) => {
	try {
		res.status(200).send("This is the base URL for this API (https://localhost:" + port + "/interoperability/api). \n Endpoints containing GET methods are: \n /admin/healthcheck \n /PassesPerStation/:stationID/:date_from/:date_to \n /PassesAnalysis/:op1_ID/:op2_ID/:date_from/:date_to \n /PassesCost/:op1_ID/:op2_ID/:date_from/:date_to \n /ChargesBy/:op_ID/:date_from/:date_to \n\n Endpoints containing POST methods are: \n /admin/resetpasses \n /admin/resetstations \n /admin/resetvehicles")
	}
	catch(err) {
		return res.status(500);
	}
});

//API Status
app.get('/interoperability/api/admin/healthcheck', (req,res) => {
	//If we add ?format=name to the end of the url queryObject will return { "format": name }
	//So queryParam returns the name (for example 'csv')
	const queryObject = url.parse(req.url, true).query;
	const queryParam = queryObject.format;
	con.ping((err) => {
    if(err) return res.status(500).json({"status":"failed", "dbconnection":"softeng2113"});  
	if (queryParam == 'csv') {
		const json2csvParser = new Parser();
		const csvres = json2csvParser.parse({"status":"OK", "dbconnection":"softeng2113"});
		return res.status(200).send(csvres);
	}
	else res.status(200).json({"status":"OK", "dbconnection":"softeng2113"});  
	//console.log(queryObject);
	})
});

//Passes Per Station
app.get('/interoperability/api/PassesPerStation/:stationID/:date_from/:date_to', (req,res) => {
	var word1 = req.params.stationID;
	var word2 = req.params.date_from;
	var word3 = req.params.date_to;
	
	const queryObject = url.parse(req.url, true).query;
	const queryParam = queryObject.format;
	
	//Check if date_from > date_to
	if (new Date(word2) > new Date(word3)) {
		return res.status(400).send("'date_from' can't be greater than 'date_to'");
	}
	
	//Check if station exists
	var sqlquery2 = 'SELECT DISTINCT Station_ID FROM station WHERE ? IN(Station_ID)';
	const words2 = [word1];
	con.query(sqlquery2, words2, function (err, result2) {
		if (err) throw  (res.status(500).json({"status" : "failed"}) && err);
		
		if (result2 == '') {
			//If the station doesn't exist then return status 400
			return res.status(400).send("Bad station request");
		}
		//If station exists
		else {
			var sqlquery = 'SELECT * FROM passes WHERE Station_ID = ? AND Timestamp > ? AND Timestamp < ?';
			const words = [word1, word2, word3];
			con.query(sqlquery, words, function (err, result) {
				if (err) throw  (res.status(500).json({"status" : "failed"}) && err);
				//Check if the result data is empty
				if (result == '') {
					return res.status(402).send("No data");
				}
				else {
					//If no error, then return the result in the correct content type
					if (queryParam == 'csv') {
						const json2csvParser = new Parser();
						const csvres = json2csvParser.parse(result);
						return res.status(200).send(csvres);
					}
					else return res.status(200).send(result);
				}
			});
		}
	});
});

//Passes Analysis
app.get('/interoperability/api/PassesAnalysis/:op1_ID/:op2_ID/:date_from/:date_to', (req,res) => {
	var word1 = req.params.op1_ID;
	var word2 = req.params.op2_ID;
	var word3 = req.params.date_from;
	var word4 = req.params.date_to;
	
	const queryObject = url.parse(req.url, true).query;
	const queryParam = queryObject.format;
	
	//Check if op1_ID == op2_ID
	if (word1 == word2) {
		return res.status(400).send("op1_ID can't be equal to op2_ID");
	}
	
	//Check if date_from > date_to
	if (new Date(word3) > new Date(word4)) {
		return res.status(400).send("'date_from' can't be greater than 'date_to'");
	}
	
	//Check if the company exists
	var sqlquery2 = 'SELECT DISTINCT Company_ID FROM company WHERE ? IN(Company_ID)';
	con.query(sqlquery2, word1, function (err, result3) {
		if (err) throw  (res.status(500).json({"status" : "failed"}) && err);
		if (result3 == '') {
			//If the conpany doesn't exist then return status 400
			return res.status(400).send("Bad company request(op1_ID doesn't exist)");
		}
		//op1_ID exists, so check if op2_ID exists
		else {
			con.query(sqlquery2, word2, function (err, result2) {
				if (err) throw  (res.status(500).json({"status" : "failed"}) && err);
				if (result2 == '') {
					//If the conpany doesn't exist then return status 400
					return res.status(400).send("Bad company request(op2_ID doesn't exist)");
				}
				//Both companies exist
				else {
					var sqlquery = 'SELECT * FROM passes WHERE Station_Provider = ? AND Tag_Provider = ? AND Timestamp > ? AND Timestamp < ?';
					const words = [word1, word2, word3, word4];
					con.query(sqlquery, words, function (err, result) {
						if (err) throw  (res.status(500).json({"status" : "failed"}) && err);
						//Check if the result data is empty
						if (result == '') {
							return res.status(402).send("No data");
						}
						else {
							//If no error, then return the result
							if (queryParam == 'csv') {
								const json2csvParser = new Parser();
								const csvres = json2csvParser.parse(result);
								return res.status(200).send(csvres);
							}							
							else  return res.status(200).send(result);
						}
					});
				}
			});
		}
	});
});

//Passes Cost
app.get('/interoperability/api/PassesCost/:op1_ID/:op2_ID/:date_from/:date_to', (req,res) => {
	var word1 = req.params.op1_ID;
	var word2 = req.params.op2_ID;
	var word3 = req.params.date_from;
	var word4 = req.params.date_to;
	
	const queryObject = url.parse(req.url, true).query;
	const queryParam = queryObject.format;
	
	//Check if op1_ID == op2_ID
	if (word1 == word2) {
		return res.status(400).send("op1_ID can't be equal to op2_ID");
	}
	
	//Check if date_from > date_to
	if (new Date(word3) > new Date(word4)) {
		return res.status(400).send("'date_from' can't be greater than 'date_to'");
	}
	
	//Check if the company exists
	var sqlquery2 = 'SELECT DISTINCT Company_ID FROM company WHERE ? IN(Company_ID)';
	con.query(sqlquery2, word1, function (err, result3) {
		if (err) throw  (res.status(500).json({"status" : "failed"}) && err);
		if (result3 == '') {
			//If the conpany doesn't exist then return status 400
			return res.status(400).send("Bad company request(op1_ID doesn't exist)");
		}
		//op1_ID exists, so check if op2_ID exists
		else {
			con.query(sqlquery2, word2, function (err, result2) {
				if (err) throw  (res.status(500).json({"status" : "failed"}) && err);
				if (result2 == '') {
					//If the conpany doesn't exist then return status 400
					return res.status(400).send("Bad company request(op2_ID doesn't exist)");
				}
				//Both companies exist
				else {
					var sqlquery = 'SELECT COUNT(Station_Provider) AS Number_Of_Passes, SUM(Amount) AS Sum_Amount, Station_Provider, Tag_Provider FROM passes WHERE Station_Provider = ? AND Tag_Provider = ? AND Timestamp > ? AND Timestamp < ?';
					const words = [word1, word2, word3, word4];
					con.query(sqlquery, words, function (err, result) {
						if (err) throw  (res.json({"status" : "failed"}) && err);
						//Check if the result data is empty
						if (result[0].Number_Of_Passes == '0') {
							return res.status(402).send("No data");
						}
						else {
							//If no error, then return the result
							if (queryParam == 'csv') {
								const json2csvParser = new Parser();
								const csvres = json2csvParser.parse(result);
								return res.status(200).send(csvres);
							}
							else return res.status(200).send(result);
						}
					});
				}
			});
		}
	});
});

//Charges By
app.get('/interoperability/api/ChargesBy/:op_ID/:date_from/:date_to', (req,res) => {
	var word1 = req.params.op_ID;
	var word2 = req.params.date_from;
	var word3 = req.params.date_to;
	
	const queryObject = url.parse(req.url, true).query;
	const queryParam = queryObject.format;
	
	//Check if date_from > date_to
	if (new Date(word2) > new Date(word3)) {
		return res.status(400).send("'date_from' can't be greater than 'date_to'");
	}
	
	//Check if the company exists
	var sqlquery2 = 'SELECT DISTINCT Company_ID FROM company WHERE ? IN(Company_ID)';
	con.query(sqlquery2, word1, function (err, result2) {
		if (err) throw  (res.status(500).json({"status" : "failed"}) && err);
		if (result2 == '') {
			//If the conpany doesn't exist then return status 400
			return res.status(400).send("Bad company request(op_ID doesn't exist)");
		}
		else {
			var sqlquery = 'SELECT DISTINCT COUNT(Tag_Provider) AS Number_Of_Passes, SUM(Amount) AS Sum_Amount, Station_Provider, Tag_Provider FROM passes WHERE Station_Provider = ? AND Tag_Provider != Station_Provider AND Timestamp > ? AND Timestamp < ? GROUP BY Station_Provider, Tag_Provider';
			const words = [word1, word2, word3];
			con.query(sqlquery, words, function (err, result) {
				if (err) throw  (res.json({"status" : "failed"}) && err);
				//Check if the result data is empty
				if (result == '') {
					return res.status(402).send("No data");
				}
				else {
					//If no error, then return the result
					if (queryParam == 'csv') {
						const json2csvParser = new Parser();
						const csvres = json2csvParser.parse(result);
						return res.status(200).send(csvres);
					}
					else return res.status(200).send(result);
				}
			});
		}
	});
});

//POST Methods

//Reset Passes
app.post('/interoperability/api/admin/resetpasses', (req,res) => {
	con.query("DELETE FROM passes", function (err, result) {
		if (err) throw  (res.status(500).json({"status" : "failed"}) && err);
		res.status(200).json({"status" : "OK"});
	});
});

//Reset Stations
app.post('/interoperability/api/admin/resetstations', (req,res) => {
	con.query("DELETE FROM station", function (err, result) {
		if (err) throw  (res.status(500).json({"status" : "failed"}) && err);
	});
	con.query("INSERT INTO station (Station_ID, Station_Name, Station_Provider) VALUES('AO00', 'aodos tolls station 00', 'aodos'),('AO01', 'aodos tolls station 01', 'aodos'),('AO02', 'aodos tolls station 02', 'aodos'),('AO03', 'aodos tolls station 03', 'aodos'),('AO04', 'aodos tolls station 04', 'aodos'),('AO05', 'aodos tolls station 05', 'aodos'),('AO06', 'aodos tolls station 06', 'aodos'),('AO07', 'aodos tolls station 07', 'aodos'),('AO08', 'aodos tolls station 08', 'aodos'),('AO09', 'aodos tolls station 09', 'aodos'),('AO10', 'aodos tolls station 10', 'aodos'),('AO11', 'aodos tolls station 11', 'aodos'),('AO12', 'aodos tolls station 12', 'aodos'),('AO13', 'aodos tolls station 13', 'aodos'),('AO14', 'aodos tolls station 14', 'aodos'),('AO15', 'aodos tolls station 15', 'aodos'),('AO16', 'aodos tolls station 16', 'aodos'),('AO17', 'aodos tolls station 17', 'aodos'),('AO18', 'aodos tolls station 18', 'aodos'),('AO19', 'aodos tolls station 19', 'aodos'),('EG00', 'egnatia tolls station 00', 'egnatia'),('EG01', 'egnatia tolls station 01', 'egnatia'),('EG02', 'egnatia tolls station 02', 'egnatia'),('EG03', 'egnatia tolls station 03', 'egnatia'),('EG04', 'egnatia tolls station 04', 'egnatia'),('EG05', 'egnatia tolls station 05', 'egnatia'),('EG06', 'egnatia tolls station 06', 'egnatia'),('EG07', 'egnatia tolls station 07', 'egnatia'),('EG08', 'egnatia tolls station 08', 'egnatia'),('EG09', 'egnatia tolls station 09', 'egnatia'),('EG10', 'egnatia tolls station 10', 'egnatia'),('EG11', 'egnatia tolls station 11', 'egnatia'),('EG12', 'egnatia tolls station 12', 'egnatia'),('GF00', 'gefyra tolls station 00', 'gefyra'),('KO00', 'kentriki_odos tolls station 00', 'kentriki_odos'),('KO01', 'kentriki_odos tolls station 01', 'kentriki_odos'),('KO02', 'kentriki_odos tolls station 02', 'kentriki_odos'),('KO03', 'kentriki_odos tolls station 03', 'kentriki_odos'),('KO04', 'kentriki_odos tolls station 04', 'kentriki_odos'),('KO05', 'kentriki_odos tolls station 05', 'kentriki_odos'),('KO06', 'kentriki_odos tolls station 06', 'kentriki_odos'),('KO07', 'kentriki_odos tolls station 07', 'kentriki_odos'),('KO08', 'kentriki_odos tolls station 08', 'kentriki_odos'),('KO09', 'kentriki_odos tolls station 09', 'kentriki_odos'),('MR00', 'moreas tolls station 00', 'moreas'),('MR01', 'moreas tolls station 01', 'moreas'),('MR02', 'moreas tolls station 02', 'moreas'),('MR03', 'moreas tolls station 03', 'moreas'),('MR04', 'moreas tolls station 04', 'moreas'),('MR05', 'moreas tolls station 05', 'moreas'),('MR06', 'moreas tolls station 06', 'moreas'),('MR07', 'moreas tolls station 07', 'moreas'),('MR08', 'moreas tolls station 08', 'moreas'),('NE00', 'nea_odos tolls station 00', 'nea_odos'),('NE01', 'nea_odos tolls station 01', 'nea_odos'),('NE02', 'nea_odos tolls station 02', 'nea_odos'),('NE03', 'nea_odos tolls station 03', 'nea_odos'),('NE04', 'nea_odos tolls station 04', 'nea_odos'),('NE05', 'nea_odos tolls station 05', 'nea_odos'),('NE06', 'nea_odos tolls station 06', 'nea_odos'),('NE07', 'nea_odos tolls station 07', 'nea_odos'),('NE08', 'nea_odos tolls station 08', 'nea_odos'),('NE09', 'nea_odos tolls station 09', 'nea_odos'),('NE10', 'nea_odos tolls station 10', 'nea_odos'),('NE11', 'nea_odos tolls station 11', 'nea_odos'),('NE12', 'nea_odos tolls station 12', 'nea_odos'),('NE13', 'nea_odos tolls station 13', 'nea_odos'),('NE14', 'nea_odos tolls station 14', 'nea_odos'),('NE15', 'nea_odos tolls station 15', 'nea_odos'),('NE16', 'nea_odos tolls station 16', 'nea_odos'),('OO00', 'olympia_odos tolls station 00', 'olympia_odos'),('OO01', 'olympia_odos tolls station 01', 'olympia_odos'),('OO02', 'olympia_odos tolls station 02', 'olympia_odos'),('OO03', 'olympia_odos tolls station 03', 'olympia_odos'),('OO04', 'olympia_odos tolls station 04', 'olympia_odos'),('OO05', 'olympia_odos tolls station 05', 'olympia_odos'),('OO06', 'olympia_odos tolls station 06', 'olympia_odos'),('OO07', 'olympia_odos tolls station 07', 'olympia_odos'),('OO08', 'olympia_odos tolls station 08', 'olympia_odos'),('OO09', 'olympia_odos tolls station 09', 'olympia_odos'),('OO10', 'olympia_odos tolls station 10', 'olympia_odos'),('OO11', 'olympia_odos tolls station 11', 'olympia_odos'),('OO12', 'olympia_odos tolls station 12', 'olympia_odos'),('OO13', 'olympia_odos tolls station 13', 'olympia_odos')", function (err, result) {
		if (err) throw  (res.status(500).json({"status" : "failed"}) && err);
		res.status(200).json({"status" : "OK"});
	});
});

//Reset Vehicles
app.post('/interoperability/api/admin/resetvehicles', (req,res) => {
	con.query("DELETE FROM vehicles", function (err, result) {
		if (err) throw  (res.status(500).json({"status" : "failed"}) && err);
	});
	con.query("INSERT INTO vehicles (Tag_ID, Tag_Provider, Vehicle_ID, License_Year) VALUES ('AO11L5271', 'aodos', 'DP11ENT03275', 2008),('AO12K0807', 'aodos', 'MX39VOS38645', 2018),('AO13W1028', 'aodos', 'RR73DWB65452', 2017),('AO18S3731', 'aodos', 'PE73VJU23485', 2010),('AO19H6549', 'aodos', 'OC94ASJ72024', 2002),('AO19M3646', 'aodos', 'BM25PHF40639', 2018),('AO27P4628', 'aodos', 'LG64ARC91224', 2019),('AO31K4646', 'aodos', 'SU00RDZ36214', 2014),('AO49I8807', 'aodos', 'YL27IFD65117', 2006),('AO69I5108', 'aodos', 'HT62RDI04611', 2000),('AO87S8322', 'aodos', 'DV04FQL29609', 2010),('AO88V0724', 'aodos', 'SY96JDQ97089', 2004),('AO94O1451', 'aodos', 'BZ76ROL87339', 2017),('EG00X1873', 'egnatia', 'TV81MAQ99005', 2000),('EG05B7264', 'egnatia', 'IW53OQE31439', 2014),('EG13U6715', 'egnatia', 'JD78PQD35395', 2002),('EG23G6966', 'egnatia', 'EC02LZC49528', 2001),('EG36L0177', 'egnatia', 'TE24LCO18661', 2009),('EG47I2811', 'egnatia', 'XE59BZM26378', 2020),('EG47U1656', 'egnatia', 'IN99SEN20660', 2014),('EG52J0268', 'egnatia', 'QU94IGC75528', 2003),('EG56V3913', 'egnatia', 'CR31GMR97972', 2000),('EG74B6896', 'egnatia', 'DW44ZOO26361', 2009),('EG76E0993', 'egnatia', 'VL67TFO75321', 2007),('EG79G1284', 'egnatia', 'TZ48CCW54765', 2015),('EG87C3789', 'egnatia', 'MU06LHX94338', 2016),('EG87N4472', 'egnatia', 'CM15YCB60994', 2005),('GF17K5976', 'gefyra', 'SL09NOT64494', 2005),('GF26E1328', 'gefyra', 'UF84JOS00561', 2020),('GF26N8608', 'gefyra', 'QN12NTR81378', 2003),('GF48M7092', 'gefyra', 'JE65QJK64802', 2002),('GF51E2190', 'gefyra', 'EN26OAB52983', 2002),('GF52G9102', 'gefyra', 'WU78BMX13511', 2008),('GF52T0389', 'gefyra', 'XF28DGK65250', 2021),('GF61W4412', 'gefyra', 'LM86GYO69819', 2010),('GF62J1185', 'gefyra', 'MP14WFM40909', 2008),('GF64H7689', 'gefyra', 'BY85QGR11636', 2018),('GF84T8932', 'gefyra', 'PF04UCA93312', 2007),('GF84U4130', 'gefyra', 'KW50MJG67260', 2016),('GF85R2347', 'gefyra', 'YX66XYW62640', 2014),('GF85Z5553', 'gefyra', 'CK97FAU13897', 2007),('GF87C4626', 'gefyra', 'IO09FGE68100', 2015),('GF94Q2036', 'gefyra', 'MA30QLI76818', 2019),('GF96B8067', 'gefyra', 'CP56DAO45598', 2017),('KO37T8485', 'kentriki_odos', 'FL13UMN92207', 2006),('KO38E3788', 'kentriki_odos', 'ED51EWW52190', 2017),('KO44J2006', 'kentriki_odos', 'WY00MLL63827', 2000),('KO53F1683', 'kentriki_odos', 'MQ65WJJ60020', 2009),('KO57Z7727', 'kentriki_odos', 'IX01MVL33676', 2001),('KO58G5356', 'kentriki_odos', 'YH66OKD41942', 2019),('KO64Z6868', 'kentriki_odos', 'QW79CHL42244', 2006),('KO69R5975', 'kentriki_odos', 'RV87TIY76692', 2001),('KO72G8546', 'kentriki_odos', 'KB55KTM48860', 2009),('KO75W9528', 'kentriki_odos', 'UO75YNW62238', 2003),('KO80I5938', 'kentriki_odos', 'QO77TFN61853', 2004),('KO82C5500', 'kentriki_odos', 'HW75BKT77773', 2016),('KO87M8492', 'kentriki_odos', 'DO24BCW15511', 2009),('KO91P5387', 'kentriki_odos', 'ZY93PCY41868', 2006),('KO95P1306', 'kentriki_odos', 'JO50FSF60755', 2011),('MR06V9056', 'moreas', 'RR98KQE80731', 2020),('MR26E3126', 'moreas', 'QO68DIC93032', 2016),('MR30M7731', 'moreas', 'HA82SCK64299', 2001),('MR36J6829', 'moreas', 'QH15HWX24570', 2009),('MR39O1247', 'moreas', 'IZ65WAT29135', 2002),('MR55V8401', 'moreas', 'EZ65FLV39493', 2012),('MR56E8319', 'moreas', 'KF48RSD79865', 2012),('MR57I0349', 'moreas', 'UA13YTK28483', 2020),('MR58R4385', 'moreas', 'QN23UHH39091', 2014),('MR63V2295', 'moreas', 'XV91YMP27722', 2012),('MR72G8045', 'moreas', 'HE38BQH01623', 2016),('MR93N1400', 'moreas', 'HR53SRO94328', 2004),('MR98F8272', 'moreas', 'BI87HYL81972', 2020),('NE09V3603', 'nea_odos', 'UP28MBM38391', 2010),('NE31Q7933', 'nea_odos', 'EV77EDV52985', 2001),('NE43B7275', 'nea_odos', 'FY47TUN40300', 2002),('NE55G3669', 'nea_odos', 'PD45WOT56494', 2010),('NE61X5911', 'nea_odos', 'JV67MTI17124', 2000),('NE66B0405', 'nea_odos', 'NY14GZR94632', 2011),('NE66N5124', 'nea_odos', 'PM58XHX45588', 2006),('NE71H2256', 'nea_odos', 'NZ35XLQ89678', 2015),('NE74M0871', 'nea_odos', 'QP02SYE47964', 2010),('NE74M6592', 'nea_odos', 'NO82BAX82566', 2000),('NE80E5551', 'nea_odos', 'VX68BAR38623', 2005),('NE83K9493', 'nea_odos', 'IA29IQS63679', 2010),('NE91T5473', 'nea_odos', 'EG95RTB75032', 2013),('NE97X0282', 'nea_odos', 'OY94SZK34436', 2007),('OO01A7197', 'olympia_odos', 'AY38OQF67603', 2020),('OO14E0167', 'olympia_odos', 'AT19HLV57173', 2004),('OO20E8329', 'olympia_odos', 'QX75YWC61835', 2019),('OO26V4144', 'olympia_odos', 'XV40HUQ04740', 2001),('OO29X6651', 'olympia_odos', 'EE22TMX10817', 2001),('OO41Q9202', 'olympia_odos', 'RK48BOP88344', 2016),('OO43C8099', 'olympia_odos', 'QR03XCJ37459', 2014),('OO49W8536', 'olympia_odos', 'JF94VYA88954', 2000),('OO58I4183', 'olympia_odos', 'EM54HQI58682', 2008),('OO59B1482', 'olympia_odos', 'VJ92OYV94295', 2000),('OO65G9691', 'olympia_odos', 'IC95TLY24827', 2020),('OO67L7721', 'olympia_odos', 'BK77KNV91142', 2007),('OO68H9901', 'olympia_odos', 'WG11QVY31890', 2006),('OO85U6024', 'olympia_odos', 'LC72NRN52084', 2001)", function (err, result) {
		if (err) throw (res.status(500).json(({"status" : "failed"}) && err))
		res.status(200).json({"status" : "OK"});
	});
});
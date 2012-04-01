chart = {
	type : 'pie',
	data : {
		datas : [0,1,2],
		names : ["Google", "Apple" , "Microsoft"],
		labels : "{name} {data}"
	}
}



chart = {
	type : 'pie',
	elements : [
		{
			name : 'Google',
			data : 0,
			label "Label"
		},

		{
			name : "Apple",
			data : 1,
			label : "{name} {data}"
		}
	] 
}


/******** to *********/

chart = {
	type : 'pie',
	elements : [
		{
			name : 'Google',
			data : 0,
			label "Label"
		},

		{
			name : "Apple",
			data : 1,
			label : "{name} {data}"
		}
	] 
}

// or
chart = {
	type : 'pie',
	elements : [
		{
			name : 'Google',
			datas : [0,1,2,],
			label ['1999','1999','0000']
		},

		{
			name : "Apple",
			data : 1,
			label : "{name} {data}"
		}
	] 
}

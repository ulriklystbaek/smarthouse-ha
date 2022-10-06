const fs = require('fs')

fs.readFile('input.csv', 'utf8' , (err, data) => {
    let pos = -1;


    const lights = [];
    const sensors = [];
    const simple = [];

    while((pos = data.indexOf('_Status,HREG,', pos + 1)) > -1) {
        const nIndex = data.substr(0, pos).lastIndexOf(',');
        const name = data.substr(nIndex + 1, pos - nIndex - 1);
        const register = parseInt(data.substr(pos + 14, 5));

        const sanitized = name.toLowerCase().replace(/-/g, '_')
            .replace(/ø/g, 'o')
            .replace(/æ/g, 'a')
            .replace(/å/g, 'a')
            .replace(/[ ()]/g, '');

        simple.push(`      - name: "${name}"
        address: ${register}
        slave: 1
        write_type: holding
        scan_interval: 1
        verify:
          input_type: holding
          address: ${register}
          state_on: 1
          state_off: 0`)
    }

console.log(simple);


    while((pos = data.indexOf('Master level status,IREG,', pos + 1)) > -1) {
        const nIndex = data.substr(0, pos).lastIndexOf(',');
        const name = data.substr(nIndex + 1, pos - nIndex - 1);
        const register = parseInt(data.substr(pos + 26, 5));

        const sanitized = name.toLowerCase().replace(/-/g, '_')
            .replace(/ø/g, 'o')
            .replace(/æ/g, 'a')
            .replace(/å/g, 'a')
            .replace(/[ ()]/g, '');

        sensors.push(`      - name: "sensor_${sanitized}"
        address: ${register}
        slave: 1
        data_type: uint16
        input_type: input
        scan_interval: 1`)
    }



    while((pos = data.indexOf('S1 Level command,HREG,', pos + 1)) > -1) {
        const nIndex = data.substr(0, pos).lastIndexOf(',');
        const name = data.substr(nIndex + 1, pos - nIndex - 1);
        const register = parseInt(data.substr(pos + 23, 5));

        const sanitized = name.toLowerCase().replace(/-/g, '_')
            .replace(/ø/g, 'o')
            .replace(/æ/g, 'a')
            .replace(/å/g, 'a')
            .replace(/[ ()]/g, '');

        lights.push(`    ${sanitized}:
      friendly_name: "${name}"
      level_template: "{{ (((states('sensor.sensor_${sanitized}')|int)*17)/6)-(85/3)  }}"
      value_template: "{{ states('sensor.sensor_${sanitized}')|int > 0 }}"
      turn_off:
        service: modbus.write_register
        data_template:
          hub: SmartHouse
          unit: 1
          address: ${register}
          value: 0
      turn_on:
        service: modbus.write_register
        data_template:
          hub: SmartHouse
          unit: 1
          address: ${register}
          value: 1
      set_level:
        service: modbus.write_register
        data_template:
          hub: SmartHouse
          unit: 1
          address: ${register}
          value: "{{ (brightness/255)*90+10 }}"`);
    }

    const content = `- platform: template
  lights:\n${lights.join('\n')}`;

    fs.writeFile('SmartHouse-lights.yaml', content, () => {});
    fs.writeFile('SmartHouse-sensors.yaml', sensors.join('\n'), () => {});
    fs.writeFile('SmartHouse-simple.yaml', simple.join('\n'), () => {});
});

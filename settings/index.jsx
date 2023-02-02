function mySettings(props) {
  return (
    <Page>
        <Section
            title={<Text bold align="center">Buzz-minder interval</Text>}>
            <Select
                label={`Buzz me every...`}
                settingsKey="buzzMinderTime"
                options={[
                    { name: "1 minute", value: "ONE_MIN" },
                    { name: "5 minutes", value: "FIVE_MINS" },
                    { name: "10 minutes", value: "TEN_MINS" },
                    { name: "20 minutes", value: "TWENTY_MINS" },
                    { name: "30 minutes", value: "THIRTY_MINS" },
                    { name: "do not buzz", value: "OFF" }
                ]} />
        </Section>
        <Section
            title={<Text bold align="center">Buzz-minder intensity</Text>}>
            <Select
                label={`Buzz intensity`}
                settingsKey="buzzIntensity"
                options={[
                    { name: "light", value: "BUZZ_LOW" },
                    { name: "medium", value: "BUZZ_MED" },
                    { name: "high", value: "BUZZ_HIGH" }
                ]} />
        </Section>
    </Page>
  );
}

registerSettingsPage(mySettings);

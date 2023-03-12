import {React, useEffect, useState} from 'react';
import { Button, Text, View } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Both URLs must be updated after running NGROK since the value changes each time it's started.
const authServer = 'https://3431-78-163-115-220.eu.ngrok.io';
const weatherServer = 'https://82f0-78-163-115-220.eu.ngrok.io';

const clientId = 'react_native_client'
WebBrowser.maybeCompleteAuthSession();
const useProxy = true;
const redirectUri = AuthSession.makeRedirectUri({
  useProxy,
});

export default function App() {
  const discovery = AuthSession.useAutoDiscovery(authServer);
  const [request, result, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: clientId,
      redirectUri,
      scopes: ['api1'],
    },
    discovery
  );

  const [authToken, setAuthToken] = useState(null);

  const [weatherInfo, setWeatherInfo] = useState(null)

  if(result != null){
    console.log("Got result");
    console.log(request);
    console.log(result);
  } else {
    console.log("Result is still null on first load");
  }

  useEffect(()=>{
    if(result != null){
      const getAuthToken = async ()=>{

        var tokenRequestParams = {
          grant_type: 'authorization_code',
          code_verifier: request.codeVerifier,
          code: result.params.code,
          client_id: clientId,
          redirect_uri: redirectUri
        }

        var formBody = [];
        for (var property in tokenRequestParams) {
          var encodedKey = encodeURIComponent(property);
          var encodedValue = encodeURIComponent(tokenRequestParams[property]);
          formBody.push(encodedKey + "=" + encodedValue);
        }
        formBody = formBody.join("&");
        console.log(formBody);

        fetch(authServer + '/connect/token', {
          method: 'POST',
          headers: {
            Accept: '*/*',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formBody
        })
        .then((response) => response.json())
        .then((responseJson) => {
          console.log(responseJson.access_token);
          setAuthToken(responseJson.access_token);
        });
      }

      getAuthToken();
    }
  }, [result]);

  useEffect(()=>{
    if(authToken != null){
      const getWeatherInfo = async ()=>{
        fetch(weatherServer + "/WeatherForecast", {
          method: 'GET',
          headers: {
            Accept: '*/*',
            Authorization: "Bearer " + authToken
          }
        })
        .then((response) => response.json())
        .then((responseJson) => {
          console.log(responseJson);
          setWeatherInfo(responseJson);
        });
      }

      getWeatherInfo();
    }

  }, [authToken]);

  console.log(authToken);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Login!" disabled={!request} onPress={() => promptAsync({ useProxy })} />
      {/* {result && <Text>{JSON.stringify(result, null, 2)}</Text>}
      {authToken && <Text>{JSON.stringify(authToken, null, 2)}</Text>} */}
      {weatherInfo && <Text>{JSON.stringify(weatherInfo, null, 2)}</Text>}
    </View>
  );
}
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@ixplor_token';
const REFRESH_TOKEN_KEY = '@ixplor_refresh_token';
const TOKEN_EXPIRES_KEY = '@ixplor_token_expires';

export interface TokensInfo {
  token: string;
  refreshToken: string;
  tokenExpires: number;
}

export const getTokensInfo = async (): Promise<TokensInfo | null> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    const tokenExpires = await AsyncStorage.getItem(TOKEN_EXPIRES_KEY);

    if (!token || !refreshToken || !tokenExpires) {
      return null;
    }

    return {
      token,
      refreshToken,
      tokenExpires: parseInt(tokenExpires, 10),
    };
  } catch (error) {
    console.error('Error getting tokens:', error);
    return null;
  }
};

export const setTokensInfo = async (tokensInfo: TokensInfo | null): Promise<void> => {
  try {
    if (!tokensInfo) {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, TOKEN_EXPIRES_KEY]);
      return;
    }

    await AsyncStorage.multiSet([
      [TOKEN_KEY, tokensInfo.token],
      [REFRESH_TOKEN_KEY, tokensInfo.refreshToken],
      [TOKEN_EXPIRES_KEY, tokensInfo.tokenExpires.toString()],
    ]);
  } catch (error) {
    console.error('Error setting tokens:', error);
  }
};

export const clearTokens = async (): Promise<void> => {
  await setTokensInfo(null);
};

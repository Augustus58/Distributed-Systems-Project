package distributedsystemsproject.service;

import org.springframework.stereotype.Service;

@Service
public class CalculationService {

  public static Double calculate(String arg1, String arg2, String op) throws Exception {
    Double arg1Double = Double.parseDouble(arg1);
    Double arg2Double = Double.parseDouble(arg2);
    Double res = null;
    switch (op) {
      case "+":
        res = arg1Double + arg2Double;
        break;
      case "-":
        res = arg1Double - arg2Double;
        break;
      case "*":
        res = arg1Double * arg2Double;
        break;
      case "/":
        res = arg1Double / arg2Double;
        break;
    }
    return res;
  }
}

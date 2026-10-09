import com.fastcgi.FCGIInterface;
import java.util.HashMap;
import java.util.Map;
import java.math.BigDecimal;
import java.util.regex.Pattern;
import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class Main {

    private static final Pattern INTEGER = Pattern.compile("-?\\d+");
    private static final Pattern DECIMAL = Pattern.compile("-?\\d+(\\.\\d+)?");
    private static final List<String> HISTORY = new ArrayList<>();
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss");


    public static void main(String[] args) {
        FCGIInterface fcgi = new FCGIInterface();
        while (fcgi.FCGIaccept() >= 0) {
            long startTime = System.nanoTime();

            String query = System.getProperty("QUERY_STRING");

            if (query == null || query.isEmpty()) {
                sendResponse("200 OK", historyJson());
                continue;
            }

            Map<String, String> params = parseQuery(query);
            String x = params.get("x");
            String y = params.get("y");
            String r = params.get("r");

            String error = validate(x, y, r);
            if (error!= null) {
                sendResponse("400 Bad Request", "{\"error\": \"" + error + "\"}");
                continue;
            }

            BigDecimal xNum = new BigDecimal(x);
            BigDecimal yNum = new BigDecimal(y);
            BigDecimal rNum = new BigDecimal(r);
            boolean hit = isInArea(xNum, yNum, rNum);

            String currentTime = LocalDateTime.now().format(TIME_FORMAT);
            long execTime = (System.nanoTime() - startTime) / 1000;


            String record = "{\"x\": \"" + x + "\", \"y\": \"" + y + "\", \"r\": \"" + r + "\", \"hit\": " + hit
                    + ", \"time\": \"" + currentTime + "\", \"execTime\": " + execTime + "}";
            HISTORY.add(record);

            sendResponse("200 OK", historyJson());
        }
    }

    private static String validate(String x, String y, String r){
        if (!inRange(x, INTEGER, "-4", "4")){
            return "X must be an integer from -4 to 4";
        }
        if (!inRange(y, DECIMAL, "-3", "5")){
            return "Y must be a number form -3 to 5";
        }
        if (!inRange(r, DECIMAL, "1", "4")){
            return "R must be a number from 1 to 4";
        }
        return null;
    }

    private static boolean inRange(String value, Pattern format, String min, String max){
        if (value == null || !format.matcher(value).matches()){
            return false;
        }
        BigDecimal number = new BigDecimal(value);
        return number.compareTo(new BigDecimal(min)) >=0
                && number.compareTo(new BigDecimal(max)) <= 0;
    }

    private static boolean isInRectangle(BigDecimal x, BigDecimal y, BigDecimal r){
        return x.signum() <=0
                && x.compareTo(r.negate()) >= 0
                && y.signum() <= 0
                && y.compareTo(r.negate()) >= 0;

    }

    private static boolean isInTriangle(BigDecimal x, BigDecimal y, BigDecimal r){
        return x.signum() >= 0
                && y.signum() >= 0
                && y.multiply(BigDecimal.valueOf(2)).compareTo(r.subtract(x)) <= 0;
    }

    private static boolean isInSector(BigDecimal x, BigDecimal y, BigDecimal r){
        return x.signum() >= 0
                && y.signum() <= 0
                && x.pow(2).add(y.pow(2)).compareTo(r.pow(2)) <= 0;
    }

    private static boolean isInArea(BigDecimal x, BigDecimal y, BigDecimal r){
        return isInRectangle(x, y, r) || isInTriangle(x, y, r) || isInSector(x, y, r);
    }

    private static void sendResponse(String status, String body){
        System.out.print(
                "HTTP/1.1 " + status + "\r\n" +
                "Content-Type: application/json\r\n" +
                "Content-Length: " + body.getBytes().length + "\r\n" +
                "\r\n"+
                body
        );
    }

    private static String historyJson(){
        return "{\"history\": [" + String.join(", " , HISTORY) + "]}";
    }

    private static Map<String, String> parseQuery(String query) {
        Map<String, String> params = new HashMap<>();
        if (query == null || query.isEmpty()) {
            return params;
        }
        for (String pair : query.split("&")) {
            String[] parts = pair.split("=", 2);
            if (parts.length == 2) {
                params.put(parts[0], parts[1]);
            }
        }
        return params;
    }
}
